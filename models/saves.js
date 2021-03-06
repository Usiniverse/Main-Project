'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class saves extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        saves.belongsTo(models.hosts, { foreignKey: 'hostId', sourceKey: 'hostId', onDelete: 'CASCADE' });
        saves.belongsTo(models.users, { foreignKey: 'userId', sourceKey: 'userId', onDelete: 'CASCADE' });
      // define association here
    }
  }
  saves.init({
    saveId : {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    userId: DataTypes.INTEGER,
    hostId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'saves',
  });
  return saves;
};