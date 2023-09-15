const db = require('../sequelize');
const { sendNotificationMail } = require('../../api/mail');
const { sequelize } = require('../sequelize');
const ConstData = require('../../util/const_data');

module.exports = {
  addDonationFunds: async ({ campaignId, credits, transaction }) => {
    const { Donation, User, Campaign } = db.models;
    const campaign = await Campaign.findOne({ where: { id: campaignId }, include: User });
    if (!campaign) return;

    await Donation.create({
      campaignId,
      balance: credits,
      initialBalance: credits
    }, { transaction });
    await sendNotificationMail({
      content: `<p>${campaign?.user?.email} user's campaign ${campaign.title} expired and ${credits} credits need to be donated.</p><p><a href="${process.env.BASE_URL}/admin-credits">Manage credits</a></p>`,
      subject: `"${campaign.title}" credits are ready for donation!`,
    });
  },
  donate: async ({ campaignId }) => {
    const { Donation } = db.models;
    await Donation.update(
      {
        balance: 0,
        donatedAt: new Date(),
      }, 
      { where: { campaignId } }
    )
  },
  moveDonationBackToSavings: async ({ campaignId, userId }) => {
    const { Donation, SavingsAccount, CreditTransaction, User } = db.models;
    const donation = await Donation.findOne({ where: { campaignId } });
    const user = await User.findOne({
      where: { id: userId },
      attributes: ['parent_id']
    });

    if (!donation) return

    const savingsAccount = await SavingsAccount.findOne({
      where: { userId },
    });

    if (!savingsAccount) return

    const donationBalance = donation.balance;
    const savingsBalance = savingsAccount.balance;
    const transaction = await sequelize.transaction();
    try {
      await donation.destroy({ transaction });
      await SavingsAccount.update(
        { balance: db.sequelize.literal('"balance"+' + donationBalance) },
        { where: { userId: user.parent_id || userId } },
        { transaction }
      );
      await CreditTransaction.create({
        userId,
        creditAmount: donationBalance,
        comment: `Transfer from donations to savings, cid: ${campaignId}`,
        type: ConstData.DEPOSIT_TRANSACTION,
        savingsBalance: savingsBalance + donationBalance,
        savingsAccountId: savingsAccount.id,
      }, { transaction });
      return transaction.commit();
    } catch(e) {
      return transaction.rollback();
    }
  },
}