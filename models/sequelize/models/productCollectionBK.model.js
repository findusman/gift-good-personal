let Helper = require('../../../util/helper');

const product_collection_bk = (sequelize, DataTypes) => {
    const ProductCollectionBK = sequelize.define('productCollectionBK', {
        collection_id: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },                                      // signature collection id
        product_id: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },                                      // signature collection id
    });

    return ProductCollectionBK;
};

module.exports = product_collection_bk;
