let BaseController = require('./BaseController');
const db = require('../models/sequelize');


module.exports = BaseController.extend({
  name: 'MainController',

  webhookEvent: async function (req, res, next) {
    const events = req.body;

    const { Contact } = db.models;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log('Setting event id=' + event.contactid);
      if (event.contactid) {
        let contact = await Contact.findOne({ where: { id: event.contactid } });
        if (contact) {
          console.log('Contact Step: ', contact.step);
          if (contact.step === 'sent' && event.event === 'bounce') {
            console.log(
              '[SendGrid web-hook] gift email was bounced ==> id: ',
              event.contactid
            );
            await contact.update({ step: 'bounced' });
            throw new Error('email bounced');
          } else if (!contact.email_opened && event.event === 'open') {
            console.log(
              '[SendGrid web-hook] gift email was opened ==> id: ',
              event.contactid
            );
            await contact.update({
              email_opened: true,
              email_opened_at: new Date(),
            });
          } else if (!contact.email_clicked && event.event === 'click') {
            console.log(
              '[SendGrid web-hook] gift email was clicked ==> id: ',
              event.contactid
            );
            await contact.update({
              email_clicked: true,
              email_clicked_at: new Date(),
            });
          }
        }
      } else if (event.reminderid) {
        const reminder_type = event.remindertype;

        let contact = await Contact.findOne({
          where: { id: event.reminderid },
        });
        if (contact) {
          if (event.event === 'delivered') {
            console.log(
              '[SendGrid web-hook] reminder email was sent ==> id: ',
              event.reminderid,
              reminder_type
            );
            if (reminder_type === 'reminder1') {
              await contact.update({ reminder1_sent: true });
            } else if (reminder_type === 'reminder2') {
              await contact.update({ reminder2_sent: true });
            } else if (reminder_type === 'reminder3') {
              await contact.update({ reminder3_sent: true });
            } else if (reminder_type === 'reminder4') {
              await contact.update({ reminder4_sent: true });
            }
          }
        }
      }
    }
    res.send({
      status: 'success',
    });
  }
});
