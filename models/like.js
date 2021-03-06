'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Like.belongsTo(models.posts, { foreignKey: 'postId', sourceKey: 'postId', onDelete: 'CASCADE' });
      Like.belongsTo(models.users, { foreignKey: 'userId', sourceKey: 'userId', onDelete: 'CASCADE' });
      // define association here 타 모델과 관계성을 나타냄(추정)
    }
  }
  Like.init({
    likeid: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
    userId: DataTypes.INTEGER,
    postId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Like',
  });
  return Like;
};