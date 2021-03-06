'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Comments.hasMany(models.images, { foreignKey: 'commentId', sourceKey: 'commentId', onDelete: 'CASCADE' });
      Comments.belongsTo(models.posts, { foreignKey: 'postId', sourceKey: 'postId', onDelete: 'CASCADE' });    
      Comments.belongsTo(models.users, { foreignKey: 'userId', sourceKey: 'userId', onDelete: 'CASCADE' });    
    }
  }
  Comments.init(
    {
      commentId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: DataTypes.INTEGER,
      nickname: DataTypes.STRING,
      comment: DataTypes.STRING,
      postId: DataTypes.INTEGER,
    },
    {
      timestamp: true,
      sequelize,
      modelName: "Comments",
    }
  );
  return Comments;
};