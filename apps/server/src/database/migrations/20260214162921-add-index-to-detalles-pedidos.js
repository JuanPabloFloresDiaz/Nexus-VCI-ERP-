'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('detalles_pedidos', ['id_pedido']);
    await queryInterface.addIndex('detalles_pedidos', ['id_producto']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('detalles_pedidos', ['id_pedido']);
    await queryInterface.removeIndex('detalles_pedidos', ['id_producto']);
  }
};
