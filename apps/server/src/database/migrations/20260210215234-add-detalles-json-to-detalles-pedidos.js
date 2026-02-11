'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('detalles_pedidos', 'detalles_producto', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('detalles_pedidos', 'detalles_producto');
  }
};
