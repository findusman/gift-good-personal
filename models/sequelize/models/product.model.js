let Helper = require('../../../util/helper');

const product = (sequelize, DataTypes) => {
  const Product = sequelize.define('product', {
    variant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    }, // Variant id on the shopify
    product_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // Product id on the shopify
    product_title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }, // Product title on the shopify
    product_type: {
      type: DataTypes.STRING,
      defaultValue: '',
    }, // Product title on the shopify
    variant_title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    inventory_management: {
      type: DataTypes.STRING,
      allowNull: true,
    }, // Variant title on the shopify
    price: DataTypes.FLOAT, // Product price(More correctly variant price)
    image_data: DataTypes.JSONB, // store image data into jsonb format, it's format is { main: '', sub: [] }
    variant_image: DataTypes.STRING, // Variant image url
    variant_options: DataTypes.STRING,
    qty: DataTypes.INTEGER, // Product quantity
    html_body: DataTypes.TEXT, // product text content

    short_desc: DataTypes.TEXT, // brief description

    impact_icon: DataTypes.STRING, // Impact icon
    impact_story_image: DataTypes.STRING, // Impact story image
    impact_story_collection: DataTypes.TEXT, // Impact story collection
    impact_story_description: DataTypes.TEXT, // Impact story description
    impact_short_description: DataTypes.TEXT, // Impact short description
    bundled_product_ids: DataTypes.TEXT, // Bundled product ids
    shippable_countries: DataTypes.ARRAY(DataTypes.STRING), // listing of countries this product can ship to

    vendor: DataTypes.STRING, // product vendor
    tags: DataTypes.ARRAY(DataTypes.STRING), // product tags
    shopify_template: DataTypes.STRING,
    shopify_handle: DataTypes.STRING,

    created_at: DataTypes.DATE, // product created at date
    updated_at: DataTypes.DATE, // product updated at date
    published_at: DataTypes.DATE, // product published at date

    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }, // product is enabled or not
    updated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
    }, // product has been updated in cron job
  });

  Product.associate = (models) => {
    Product.belongsToMany(models.SignatureCollection, {
      through: 'productCollection',
      foreignKey: 'product_id',
    }); // A product has n:m relationship with SignatureCollection
    Product.belongsToMany(models.Campaign, {
      through: 'productCampaign',
      foreignKey: 'product_id',
    }); // A product has n:m relationship with SignatureCollection table
    Product.hasMany(models.ProductOptions)
  };

  return Product;
};

module.exports = product;
