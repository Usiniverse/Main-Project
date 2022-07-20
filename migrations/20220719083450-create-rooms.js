'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Rooms", {
      roomid: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING,
      },
      hostNickname: {
        type: Sequelize.STRING,
      },
      hostImg: {
        type: Sequelize.STRING,
      },
      max: {
        type: Sequelize.STRING,
      },
      hashTag: {
        type: Sequelize.JSON,
      },
      roomUserNickname: {
        type: Sequelize.STRING,
      },
      roomUserNum: {
        type: Sequelize.INTEGER,
      },
      roomUserImg: {
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
    await queryInterface.dropTable('Rooms');
  }
};