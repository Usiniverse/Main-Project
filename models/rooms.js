'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rooms extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Rooms.init(
    {
      roomId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: DataTypes.STRING,
      hostId: DataTypes.STRING,
      hostNickname: DataTypes.STRING,
      hostImg: DataTypes.STRING,
      max: DataTypes.STRING,
      hashTag: DataTypes.JSON,
      roomUserId: DataTypes.JSON,
      roomUserNickname: DataTypes.JSON,
      roomUserNum: DataTypes.INTEGER,
      roomUserImg: DataTypes.JSON,
    },
    {
      timestamp: true,
      sequelize,
      modelName: "Rooms",
    }
  );
  return Rooms;
};
