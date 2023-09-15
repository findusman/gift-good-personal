const libraryMessage = (sequelize, DataTypes) => {
  const LibraryMessage = sequelize.define('libraryMessage', {
      id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER
      },
      content: {
          type: DataTypes.STRING,
          allowNull: false
      },
      title: {
          type: DataTypes.STRING
      },
      // default predefined message, available for every user
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }                                             
  });

  LibraryMessage.associate = models => {
    LibraryMessage.belongsTo(models.User);
  };

  return LibraryMessage;
};

module.exports = libraryMessage;
