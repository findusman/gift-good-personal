let sgMail = require('@sendgrid/mail');
const sanitizeHtml = require('sanitize-html');
const jwt = require('jsonwebtoken');
const Campaign = require('../models/bridge/CampaignBridge');
const Contact = require('../models/bridge/ContactBridge');
const Setting = require('../models/bridge/SettingBridge');
const { getCustomerLandingShortUrl } = require('../api/url');
const { checkIfMediaShouldBeDisplayed } = require('../api/campaign');

const senderData = {
  email: process.env.SENDGRID_SENDER_EMAIL,
  name: 'Gifts for Good',
};

const getContactEmailData = (contact) => {
  const { shouldDisplayLogo, shouldDisplayBanner } = checkIfMediaShouldBeDisplayed(contact['campaign'], true);
  const isCCEnabled = (contact.campaign.cc_email && contact.from_email) ?? false;
  return {
    to: contact['to_email'],
    from: senderData,
    ...(isCCEnabled && {cc: contact['from_email'] }),
    templateId: contact['template_id'],
    dynamic_template_data: {
      subject: contact['subject'],
      message: contact['content'],
      gfg_logo: contact['campaign']['email_include_gfg_logo'] ? `${process.env.BASE_URL}/resources/images/logo.png` : '',
      logo_url: shouldDisplayLogo ? `${process.env.BASE_URL}${contact['campaign']['logo_url']}` : '',
      banner_url: shouldDisplayBanner ? `${process.env.BASE_URL}${contact['campaign']['banner_url']}` : '',
      gift_icon_url:
        process.env.BASE_URL + '/resources/images/gift-icon.png',
      gift_url: getCustomerLandingShortUrl({ shortUrl: contact['shortUrl'], id: contact['id'] }),
      from_first_name: contact['from_first_name'],
      from_company_name: contact['from_company_name'],
      expire_date: contact['expire_date'],
      singleProduct: contact['singleProduct'],
      declineGiftUrl: getDeclineGiftUrl(contact),
      preheader: `${contact['to_first_name']}, ${contact['from_first_name']} at ${contact['from_company_name']} sent you a gift that gives back from Gifts for Good.`,
    }
  }
};

const getDeclineGiftUrl = (contact, isPreview) => {
  const urlToken = jwt.sign({ id: contact['id'] }, process.env.JWT_SECRET);
  return `${process.env.BASE_URL}/customer/decline-gift?token=${urlToken}${isPreview ? '&preview=1' : ''}`;
}

// TODO Refactor
const getContactMessage = (message, contact) => {
  if (!message) {
    return null;
  }
  return message
    .split(':first_name')
    .join(contact['to_first_name'])
    .split(':last_name')
    .join(contact['to_last_name'])
    .split(':email')
    .join(contact['to_email'])
    .split(':company')
    .join(contact['to_company_name'])
    .split(':name')
    .join(contact['to_first_name'] + ' ' + contact['to_last_name'])
    .split(':sender_first_name')
    .join(contact['from_first_name'])
    .split(':sender_last_name')
    .join(contact['from_last_name'])
    .split(':sender_email')
    .join(contact['from_email'])
    .split(':sender_company')
    .join(contact['from_company_name'])
    .split(':sender_name')
    .join(
      contact['from_first_name'] + ' ' + contact['from_last_name']
    )
    .replace(/(\r\n|\n|\r)/g, '<br />');
}

const sendMail = async function (param) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const { enable_new_send_gift: sendGiftV2 } = await Setting.getSettings();

    if (param['type'] === 'send-reminder') {
      const contacts = param['contacts'];
      let mail_data_array = contacts.map((contact) => getContactEmailData(contact));
      await sgMail.send(mail_data_array);
    } else if (param['type'] === 'send-demo-gift') {
      const contact = param['contact'];
      const mail_data_array = [
        {
          to: contact['to_email'],
          from: senderData,
          templateId: process.env.SENDGRID_DEMO_EMAIL_ID,
          custom_args: { contactid: contact['id'] },
          dynamic_template_data: {
            subject:
              'The Sales Team at Gifts for Good has sent you a gift that gives back!',
            preview_text:
              'Send a collection of gifts that give back with GIFTforward',
            logo_url: contact['logo_url']
              ? process.env.S3_BUCKET_URL + contact['logo_url']
              : process.env.BASE_URL + '/resources/images/logo.png',
            banner_url: process.env.S3_BUCKET_URL + contact['banner_url'],
            gift_url: getCustomerLandingShortUrl({ shortUrl: contact['shortUrl'], id: contact['id'] }),
            message: getContactMessage(contact['message'], contact),
            sender_name: contact['from_first_name'],
            receiver_name: contact['to_first_name'],
            sender_company: contact['from_company_name'],
          },
        },
      ];
      await sgMail.send(mail_data_array);
    } else if (param['type'] === 'send-test-gift') {
      const contact_data = param['data'];
      const targets = param['targets'];
      const emailTemplateId = (sendGiftV2 ? process.env.SENDGRID_GIFT_EMAIL_ID_V2 : process.env.SENDGRID_GIFT_EMAIL_ID) || process.env.SENDGRID_GIFT_EMAIL_ID;

      let mail_data_array = [];
      targets.forEach(function (target_email) {
        const message = contact_data['campaign']['email_message'] || contact_data['campaign']['message'];
        const singleProduct = contact_data['campaign'].single_product ?? false;
        const { shouldDisplayLogo, shouldDisplayBanner } = checkIfMediaShouldBeDisplayed(contact_data['campaign'], true);

        const subject = contact_data['campaign']['email_subject']
          ? sanitizeHtml(getContactMessage(contact_data['campaign']['email_subject'], contact_data), { allowedTags: [] })
          : '';

        const mail_data = {
          to: target_email,
          from: senderData,
          templateId: emailTemplateId,
          dynamic_template_data: {
            subject: subject || 'Gifts for Good has sent you a gift for good!',
            logo_url: shouldDisplayLogo ? `${process.env.BASE_URL}${contact_data['campaign']['logo_url']}` : '',
            banner_url: shouldDisplayBanner ? `${process.env.BASE_URL}${contact_data['campaign']['banner_url']}` : '',
            gift_url: `${process.env.BASE_URL}/preview/landing-page?where=dashboard&cid=${contact_data['campaign']['id']}`,
            gfg_logo: contact_data['campaign']['email_include_gfg_logo'] ? `${process.env.BASE_URL}/resources/images/logo.png` : '',
            message: getContactMessage(message, contact_data),
            sender_name: contact_data['from_first_name'],
            receiver_name: contact_data['to_first_name'],
            sender_company: contact_data['from_company_name'],
            singleProduct,
            declineGiftUrl: getDeclineGiftUrl(contact_data, true),
          },
        };
        mail_data_array.push(mail_data);
      });
      await sgMail.send(mail_data_array);
      console.log('Test email sent count ', mail_data_array.length);
    } else if (param['type'] === 'user-activate') {
      const email_verify_token = param['token'];
      const email = param['email'];
      const mail_data = {
        to: email,
        from: senderData,
        templateId: process.env.SENDGRID_ACTIVATION_EMAIL_ID,
        dynamic_template_data: {
          subject: 'Activate your account with Gifts For Good!',
          verify_link:
            process.env.BASE_URL + '/verify?token=' + email_verify_token,
        },
      };

      await sgMail.send(mail_data);
    } else if (param['type'] === 'customer-question') {
      const from_email = param['from'];
      const to_email = param['to'];
      const name = param['name'];
      const question = param['question'];
      const mail_data = {
        to: to_email,
        from: senderData,
        templateId: process.env.SENDGRID_QUESTION_EMAIL_ID,
        dynamic_template_data: {
          subject: 'Question from <' + from_email + '>',
          question: question,
          name: name,
          email: from_email,
        },
      };

      await sgMail.send(mail_data);
    } else if (param['type'] === 'forgot-password') {
      const email = param['email'];
      const reset_link = param['reset_link'];
      const firstname = param['firstname'];

      const mail_data = {
        to: email,
        from: senderData,
        templateId: process.env.SENDGRID_RESET_PASSWORD_EMAIL_ID,
        dynamic_template_data: {
          subject:
            'Password reset instructions for your Gift for Good account',
          reset_link,
          firstname,
        },
      };

      await sgMail.send(mail_data);
    }
  } catch (err) {
    console.log('MailController::sendMail ', err);
    return false;
  }
  return true;
};

const sendInitialGiftMail = async function ({ contacts, ccEnabled, enabledCCContacts }) {
  console.log('sendInitialGiftMail');

  const isCCEnabled = (contactId) => {
    if (ccEnabled) {
      return true;
    }

    if (!enabledCCContacts) {
      return false;
    }

    return enabledCCContacts.find((contact) => contact.id === contactId)?.ccEnabled;
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    let mda = [];
    const { enable_new_send_gift: sendGiftV2 } = await Setting.getSettings();
    const emailTemplateId = (sendGiftV2 ? process.env.SENDGRID_GIFT_EMAIL_ID_V2 : process.env.SENDGRID_GIFT_EMAIL_ID) || process.env.SENDGRID_GIFT_EMAIL_ID;

    contacts.forEach((contact) => {
      const { shouldDisplayLogo, shouldDisplayBanner } = checkIfMediaShouldBeDisplayed(contact['campaign'], true);
      const defaultSubject = `${contact['from_first_name']} at ${contact['from_company_name']} has sent you a gift for good!`;
      const message = contact['campaign']['email_message'] || contact['campaign']['message'];
      const singleProduct = contact?.campaign?.single_product ?? false;

      const mail_data = {
        to: contact['to_email'],
        from: senderData,
        ...(isCCEnabled(contact.id) && {cc: contact['from_email']}),
        templateId: emailTemplateId,
        custom_args: { contactid: contact['id'] },
        dynamic_template_data: {
          subject: contact['campaign']['email_subject']
            ? sanitizeHtml(getContactMessage(contact['campaign']['email_subject'], contact), { allowedTags: [] })
            : defaultSubject,
          gfg_logo: contact['campaign']['email_include_gfg_logo'] ? `${process.env.BASE_URL}/resources/images/logo.png` : '',
          logo_url: shouldDisplayLogo ? `${process.env.BASE_URL}${contact['campaign']['logo_url']}` : '',
          banner_url: shouldDisplayBanner ? `${process.env.BASE_URL}${contact['campaign']['banner_url']}` : '',
          gift_url: getCustomerLandingShortUrl({ shortUrl: contact['shortUrl'], id: contact['id'] }),
          message: getContactMessage(message, contact),
          sender_name: contact['from_first_name'],
          receiver_name: contact['to_first_name'],
          sender_company: contact['from_company_name'],
          singleProduct,
          declineGiftUrl: getDeclineGiftUrl(contact),
          preheader: `${contact['to_first_name']}, ${contact['from_first_name']} at ${contact['from_company_name']} sent you a gift that gives back from Gifts for Good.`
        },
      };
      return mda.push(mail_data);
    });

    sgMail
      .send(mda)
      .then(() => {
        console.log('sendInitialGiftMail emails sent successfully!');
      })
      .catch((error) => {
        console.error('sendInitialGiftMail error', error);
        throw new Error('sendInitialGiftMail error');
      });
  } catch (err) {
    console.log('MailController::sendInitialGiftMail ', err);
    return false;
  }
  return true;
};

const sendGiftCampaign = async function ({ campaignId, includeContactsWithDeliveryDate }) {
  try {
    const contacts = await Contact.get_ready_contacts_in_campaign({
      campaignId,
      includeContactsWithDeliveryDate
    });
    const campaign = await Campaign.get_one(null, campaignId, true);
    const isCCEnabled = campaign['cc_email'];

    if (contacts && contacts.length) {
      await sendInitialGiftMail({ contacts, ccEnabled: isCCEnabled });
      await Contact.gift_email_sent(contacts);
      await Campaign.update_campaign_sent(campaignId);
    }
  } catch (err) {
    console.log('Send Gift Campaign Error', err);
  }
};

const sendNotificationMail = async function({ content, subject, ccAdmin = false }) {
  try {
    const mailData = {
      to: process.env.SUPPORT_EMAIL,
      from: {
        email: process.env.SENDGRID_SENDER_EMAIL,
        name: 'Gifts for Good Notification',
      },
      subject,
      html: content,
      ...(ccAdmin && {cc: process.env.GFG_ADMIN_TEAM_EMAIL.split(',')})
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send(mailData);
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
};

module.exports = {
  sendMail,
  sendInitialGiftMail,
  sendGiftCampaign,
  sendNotificationMail,
  getContactMessage,
}
