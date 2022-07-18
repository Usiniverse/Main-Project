'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class host extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  host.init({
    title: DataTypes.STRING,
    category: DataTypes.STRING,
    houstInfo: DataTypes.STRING,
    mainAddress: DataTypes.STRING,
    subAddress: DataTypes.STRING,
    stepSelect: DataTypes.STRING,
    stepInfo: DataTypes.STRING,
    link: DataTypes.STRING,
    hostContent: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'host',
  });
  return host;
};