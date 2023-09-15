const db = require('../sequelize');

module.exports = {
  createLibraryMessage: async function(data) {
    const { LibraryMessage } = db.models;
    await LibraryMessage.create(data);
  },
  getLibraryMessages: async function({ userId, getDefault }) {
    const { LibraryMessage } = db.models;
    const condition = getDefault ? { is_default: true } : { userId };
    const messages = await LibraryMessage.findAll({
      where: condition
    });
    return messages;
  },
}