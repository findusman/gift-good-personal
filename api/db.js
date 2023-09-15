const db = require("../models/sequelize");

const createRecordsInBatches = async ({ data, batchSize, model }) => {
  const transaction = await db.sequelize.transaction();
  let insertedData = [];
  try {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const newInserted = await model.bulkCreate(batch, { returning: true, transaction });
      insertedData = insertedData.concat(newInserted);
    }
    transaction.commit();
    return insertedData;
  } catch(error) {
    console.error(`Batches creating error in model: ${model}`, error);
    transaction.rollback();
  }
};

module.exports = {
  createRecordsInBatches
}
