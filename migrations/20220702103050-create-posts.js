'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("posts", {
      postId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      hostId: {
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
      },
      nickname: {
        type: Sequelize.STRING,
      },
      content: {
        type: Sequelize.STRING,
      },
      title: {
        type: Sequelize.STRING,
      },
      commentId: {
        type: Sequelize.INTEGER,
      },
      commentNum: {
        type: Sequelize.INTEGER,
      },
      likeNum: {
        type: Sequelize.INTEGER,
      },
      islike: {
        type: Sequelize.BOOLEAN,
      },
      mainAddress: {
        type: Sequelize.STRING,
      },
      subAddress: {
        type: Sequelize.STRING,
      },
      category: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.STRING,
      },
      link: {
        type: Sequelize.STRING,
      },
      houseTitle: {
        type: Sequelize.STRING,
      },
      tagList: {
        type: Sequelize.STRING,
      },
      preImages: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
  }
};