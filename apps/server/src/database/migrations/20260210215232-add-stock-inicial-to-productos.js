'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('productos', 'stock_inicial', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('productos', 'stock_inicial');
  }
};
