const signature_collection = (sequelize, DataTypes) => {
    const SignatureCollection = sequelize.define('signatureCollection', {
        shopify_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },                       // Id on the shopify
        type: {
            type: DataTypes.STRING,
            defaultValue: 'gifts',
            allowNull: true,
        },                                                  // Collection type
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },                                                  // Collection title
        title_short: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
        },                                                  // Collection short title
        title_long: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
        },                                                  // Collection long title
        title_dropdown: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
        },                                                  // Collection dropdown title
        internal: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },                                                  // This collection is internal or not
        enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },                                                  // Enabled or disabled
        editable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },                                                  // Editable or not
        shopify: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },                                                  // Shopify collection or not
        sequence: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },                                                   // Signature collection display order
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },                                                   // Signature collection display order
        product_order: {
            type: DataTypes.TEXT
        }
    });

    SignatureCollection.associate = models => {
        SignatureCollection.belongsToMany(models.Product, { through: 'productCollection', foreignKey: 'collection_id' });                 // A SignatureCollection has n:m relationship with Product
        SignatureCollection.hasMany(models.Campaign, { foreignKey: 'collection_id' });
    };

    return SignatureCollection;
};

module.exports = signature_collection;
