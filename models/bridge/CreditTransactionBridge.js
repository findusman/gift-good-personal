let cheerio = require('cheerio');
const db = require('../sequelize');
const { Op } = require('sequelize');
const ConstData = require('../../util/const_data');
const DonationBridge = require('./DonationBridge');
const CampaignAccountBridge = require('./CampaignAccountBridge');
const { sequelize } = require('../sequelize');
const { sendNotificationMail } = require('../../api/mail');

module.exports = {
  /**
   * Get current credit balance of the user
   * @param user_id
   * @returns {Promise<*>}
   */
  get_credit_balance: async function (user_id) {
    const { SavingsAccount } = db.models;
    const account = await SavingsAccount.findOne({
      where: { userId: user_id },
    });
    let balance = account != null ? account['balance'] : 0;
    return balance;
  },
  credit_accounts: async function (user_id) {
    const { CampaignAccount, Campaign } = db.models;
    const accounts = await CampaignAccount.findAll({
      include: Campaign,
      where: { user_id: user_id, closed: false },
    });
    return accounts;
  },
  get_history: async function (userIds) {
    const { CreditTransaction } = db.models;

    return await CreditTransaction.findAll({
      order: [['createdAt', 'DESC']],
      where: { userId: userIds },
      raw: true,
    });
  },
  get_stripe_transaction_history: async function (user_id) {
    const { CreditTransaction } = db.models;
    return await CreditTransaction.findAll({
      order: [['createdAt', 'DESC']],
      where: { userId: user_id, type: ConstData.STRIPE_TRANSACTION },
      raw: true,
    });
  },

  /**
   * Deduct user credit balance
   * @param user_id
   * @param credit_amount
   * @param usd_amount
   * @param comment
   * @returns {Promise<void>}
   */
  create_campaign_account: async function ({ user_id, parent_id, credit_amount, comment, campaign_id }) {
    const { CreditTransaction, SavingsAccount, CampaignAccount } = db.models;

    const account = await SavingsAccount.findOne({
      where: { userId: parent_id || user_id },
    });

    const transaction = await sequelize.transaction();
    const savingsBalance = account.balance - credit_amount;

    try {
      await CampaignAccount.create({
        credit_amount: credit_amount,
        campaignId: campaign_id,
        user_id: user_id,
      }, { transaction });

      await SavingsAccount.update(
        {
          balance: db.sequelize.literal('"balance"-' + credit_amount),
        },
        { where: { userId: parent_id || user_id } },
        { transaction }
      );

      await CreditTransaction.create({
        userId: user_id,
        creditAmount: credit_amount,
        comment: comment,
        type: ConstData.WITHDRAWL_TRANSACTION,
        savingsAccountId: account.id,
        savingsBalance,
        campaignId: campaign_id,
        campaignBalance: credit_amount,
      }, { transaction });

      transaction.commit();
    } catch (e) {
      console.error(e);
      transaction.rollback();
    }
  },

  purchase_user_credit: async function (
    user_id,
    credit_amount,
    usd_amount,
    stripe_id
  ) {
    const { CreditTransaction, SavingsAccount } = db.models;
    const creditAmount = parseFloat(credit_amount);

    const [savingsAccount, created] = await SavingsAccount.findOrCreate({
      where: { userId: user_id },
      defaults: {
        userId: user_id,
        balance: creditAmount,
      },
    });

    const transaction = await sequelize.transaction();
    try {
      if (!created) {
        await SavingsAccount.update(
          {
            balance: db.sequelize.literal('"balance"+' + creditAmount),
          },
          { where: { userId: user_id } },
          { transaction },
        );
      }

      await CreditTransaction.create({
        userId: user_id,
        creditAmount: creditAmount,
        usd_amount: usd_amount,
        type: ConstData.STRIPE_TRANSACTION,
        stripeId: stripe_id,
        comment: 'Credits added to savings account',
        savingsBalance: created ? creditAmount : savingsAccount.balance + creditAmount,
      }, { transaction });

      transaction.commit();
    } catch (e) {
      console.log('error', e);
      transaction.rollback();
    }
  },

  update_savings_account_balance: async function ({
    user_id,
    parent_id,
    credit_amount,
    comment,
    createCreditTransaction,
    type
  }) {
    const { SavingsAccount, CreditTransaction } = db.models;

    const [savingsAccount, created] = await SavingsAccount.findOrCreate({
      where: { userId: parent_id || user_id },
      defaults: {
        userId: parent_id || user_id,
        balance: credit_amount,
      },
    });

    const transaction = await sequelize.transaction();
    try {
      if (createCreditTransaction) {
        await CreditTransaction.create({
          ...(comment && comment.length > 0) && { comment },
          ...{
            userId: user_id,
            creditAmount: credit_amount,
            type: type || ConstData.ADMIN_TRANSACTION,
            savingsAccountId: savingsAccount.id,
            savingsBalance: credit_amount
          }
        }, { transaction });
      }

      if (!created) {
        await SavingsAccount.update(
          { balance: credit_amount },
          { where: { userId: parent_id || user_id } },
          { transaction }
        );
      }

      transaction.commit();
    } catch (e) {
      transaction.rollback();
    }
  },

  update_campaign_account_balance: async function ({
    user,
    amount,
    campaignId,
    transactionType,
    comment,
    transaction,
  }) {
    const { CampaignAccount, CreditTransaction, SavingsAccount } = db.models;
    const operator =
      transactionType === ConstData.WITHDRAWL_TRANSACTION
        ? '"credit_amount"-' + amount
        : '"credit_amount"+' + amount;

    const savingsAccount = await SavingsAccount.findOne({
      where: { userId: user.parent_id || user.id },
    });

    const [campaignAccount, created] = await CampaignAccount.findOrCreate({
      where: { campaignId: campaignId },
      defaults: {
        credit_amount: amount,
        user_id: user.id,
        closed: false,
      },
    });

    if (campaignAccount) {
      const campaignBalance = transactionType === ConstData.WITHDRAWL_TRANSACTION ?
        campaignAccount.credit_amount - amount : campaignAccount.credit_amount + amount;
      const savingsBalance = transactionType === ConstData.WITHDRAWL_TRANSACTION ?
        savingsAccount.balance + amount : savingsAccount.balance - amount

      await CreditTransaction.create({
        userId: user.id,
        creditAmount: amount,
        comment,
        type: transactionType,
        campaignBalance,
        campaignId,
        savingsBalance,
        savingsAccountId: savingsAccount?.id,
      }, { transaction });
    }

    if (!created) {
      await CampaignAccount.update(
        {
          credit_amount: db.sequelize.literal(operator),
        },
        { where: { campaignId: campaignId } },
        { transaction },
      );
    }
  },
  transfer_from_campaign_to_savings: async function ({ amount, campaignId, commentPrefix, commentSuffix }) {
    const { CreditTransaction, SavingsAccount, CampaignAccount , User } = db.models;
    const campaignAccount = await CampaignAccount.findOne({
      where: { campaignId: campaignId, closed: false },
      include: [{
        model: User,
        attributes: ['parent_id'],
      }]
    });

    if (!campaignAccount) return

    const savingsAccount = await SavingsAccount.findOne({
      where: { userId: campaignAccount.user.parent_id || campaignAccount.user_id }
    });
    const transaction = await sequelize.transaction();

    try {
      const savingsAccountId = savingsAccount.id;
      const savingsBalance = savingsAccount.balance + amount;
      const campaignBalance = campaignAccount.credit_amount - amount;

      const comment = `${commentPrefix} - campaign ${campaignId} transfer to Savings Account ${savingsAccountId}${commentSuffix ? ' - ' + commentSuffix : ''}`;
      await CreditTransaction.create({
        userId: campaignAccount.user_id,
        creditAmount: amount,
        usd_amount: 0,
        comment,
        type: ConstData.DEPOSIT_TRANSACTION,
        savingsAccountId,
        savingsBalance,
        campaignId,
        campaignBalance,
      }, { transaction });

      await SavingsAccount.update(
        {
          balance: db.sequelize.literal('"balance"+' + amount),
        },
        { where: { userId: campaignAccount.user.parent_id || campaignAccount.user_id } },
        { transaction },
      );
      await CampaignAccount.update(
        {
          credit_amount: db.sequelize.literal('"credit_amount"-' + amount),
        },
        { where: { campaignId: campaignAccount.campaignId } },
        { transaction },
      );

      transaction.commit();
    } catch (e) {
      transaction.rollback();
    }
  },

  transfer_from_savings_to_campaign: async function({ amount, campaignId, balanceHolderId, comment, transaction }) {
    const { CreditTransaction, SavingsAccount, CampaignAccount } = db.models;
    const campaignAccount = await CampaignAccount.findOne({
      where: { campaignId: campaignId },
    });

    const savingsAccount = await SavingsAccount.findOne({
      where: { userId: balanceHolderId }
    });
    const savingsAccountId = savingsAccount.id;
    const savingsBalance = savingsAccount.balance - amount;
    const campaignBalance = campaignAccount.credit_amount + amount;

    if (!campaignAccount) return

    await SavingsAccount.update(
      {
        balance: db.sequelize.literal('"balance"-' + amount),
      },
      { where: { userId: balanceHolderId } },
      { transaction },
    );
    await CampaignAccount.update(
      {
        credit_amount: db.sequelize.literal('"credit_amount"+' + amount),
        closed: false,
      },
      { where: { campaignId: campaignAccount.campaignId } },
      { transaction },
    );
    await CreditTransaction.create({
      userId: balanceHolderId,
      creditAmount: amount,
      usd_amount: 0,
      comment,
      type: ConstData.DEPOSIT_TRANSACTION,
      savingsAccountId,
      savingsBalance,
      campaignId,
      campaignBalance,
    }, { transaction });
  },

  close_campaign_accounts: async function () {
    const { Campaign, CampaignAccount, User } = db.models;

    await CampaignAccountBridge.check_negative_balance_closed_accounts();

    const openCampaignAccounts = await CampaignAccount.findAll({
      where: {
        closed: false,
      },
      include: [{
        model: Campaign,
        attributes: ['donate_unredeemed'],
        where: {
          [Op.or]: [
            { expire_date: { [Op.lte]: new Date(), [Op.ne]: null } },
            { enabled: false }
          ],
        },
      }, {
        model: User
      }]
    });
    console.log(
      'Transfer and Close Open Account Count:',
      openCampaignAccounts.length
    );
    for (const campaignAccount of openCampaignAccounts) {
      await this.transfer_and_close({ account: campaignAccount, campaignId: null });
    }
  },
  transfer_and_close: async function ({ account, campaignId, changingOwnership }) {
    const { CreditTransaction, SavingsAccount, CampaignAccount, Campaign, User, Contact } = db.models;

    let campaignAccount = account;

    if (campaignId) {
      campaignAccount = await CampaignAccount.findOne({
        where: { campaignId: campaignId, closed: false },
        include: [{
          model: Campaign,
          attributes: ['donate_unredeemed', 'price'],
          include: {
            model: Contact,
            attributes: ['id'],
            required: false,
            where: {
              step: 'reactivated'
            }
          }
        },
        {
          model: User,
          attributes: ['parent_id']
        }]
      });
    }

    if (!campaignAccount) return;

    if (campaignAccount.credit_amount < 0) {
      await sendNotificationMail({
        content: `
          <p>Campaign account cannot be closed</p>
          <p>There is a negative balance in campaign account ${campaignAccount.campaignId}</p>
          <p>Balance: ${campaignAccount.credit_amount}</p>
        `,
        subject: `Campaign Account ${campaignAccount.campaignId} cannot be closed`,
        ccAdmin: true
      });
      console.error(`Incorrect negative balance for campaign ${campaignId}. Campaign account has not been closed.`);
      return;
    }

    // If there are reactivated contacts, keep credits for them on campaign account, transfer all other remaining credits
    const numberOfReactivatedContacts = campaignAccount.campaign.contacts?.length;
    let newCampaignBalance = 0;
    let amountToTransfer = campaignAccount.credit_amount;
    if (numberOfReactivatedContacts) {
      newCampaignBalance = numberOfReactivatedContacts * campaignAccount.campaign.price;
      amountToTransfer = amountToTransfer - newCampaignBalance;
    }
    const shouldDonateCredits = !changingOwnership && campaignAccount.campaign?.donate_unredeemed;

    const transaction = await db.sequelize.transaction();
    try {
      await CreditTransaction.create({
        userId: campaignAccount.user_id,
        creditAmount: amountToTransfer,
        usd_amount: 0,
        comment: `Cron Job: Campaign Account transfer to ${shouldDonateCredits ? 'Donations' : 'Savings Account'}`,
        type: ConstData.DEPOSIT_TRANSACTION,
        campaignId: campaignAccount.campaignId,
        campaignBalance: newCampaignBalance,
      }, { transaction });

      if (shouldDonateCredits) {
        await DonationBridge.addDonationFunds({
          campaignId: campaignAccount.campaignId,
          credits: amountToTransfer,
          transaction,
        });
      } else {
        await SavingsAccount.update(
          {
            balance: db.sequelize.literal('"balance"+' + amountToTransfer),
          },
          {
            where: { userId: campaignAccount.user.parent_id || campaignAccount.user_id },
            transaction,
          },
        );
      }
      // Close campaign account unless there are reactivated contacts
      await CampaignAccount.update(
        {
          credit_amount: newCampaignBalance,
          closed: !numberOfReactivatedContacts,
        },
        {
          where: { campaignId: campaignAccount.campaignId },
          transaction
        },
      );
      transaction.commit()
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      return;
    }

    console.log(`Campaign Account ${campaignAccount.campaignId} has been closed.`);

    return campaignAccount;
  },

  calculateCampaignBalance: async function({ campaignId }) {
    const { Contact, Campaign, User } = db.models;
    const campaign = await Campaign.findOne({
      where: {
        id: campaignId
      },
      attributes: ['price', 'title'],
      include: {
        model: User,
        attributes: ['email']
      }
    });
    const activeContacts = await Contact.findAndCountAll({
      where: {
        campaignId,
        step: ['ready', 'sending', 'sent', 'bounced', 'reactivated']
      },
    });
    return {
      correctBalance: activeContacts.count *  campaign.price,
      activeContacts: activeContacts.count,
      price: campaign.price,
      userEmail: campaign.user.email,
      title: campaign.title,
    };
  },
  getCampaignAccountAndSavings: async function({ campaignId, balanceHolderId }) {
    const { SavingsAccount, CampaignAccount } = db.models;
    const savingsAccount = await SavingsAccount.findOne({
      where: { userId: balanceHolderId },
    });
    const campaignAccount = await CampaignAccount.findOne({
      where: { campaignId }
    });
    return { savingsAccount, campaignAccount };
  }
};
