const libraryAsset = (sequelize, DataTypes) => {
    const LibraryAsset = sequelize.define('libraryAsset', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING
        },
        type: {
           type: DataTypes.STRING,
           allowNull: false,
           validate: {
               isIn: [['logo', 'video', 'banner', 'image']]
           }
        },
        // default predefined asset available for every user
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }                                           
    });

    LibraryAsset.associate = models => {
        LibraryAsset.belongsTo(models.User);
    };

    return LibraryAsset;
};

module.exports = libraryAsset;
