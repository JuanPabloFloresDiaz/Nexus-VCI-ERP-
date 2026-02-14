'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('pedidos', ['id_empresa']);
    await queryInterface.addIndex('pedidos', ['id_cliente']);
    await queryInterface.addIndex('pedidos', ['id_usuario_creador']);
    await queryInterface.addIndex('pedidos', ['estado_pedido']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('pedidos', ['id_empresa']);
    await queryInterface.removeIndex('pedidos', ['id_cliente']);
    await queryInterface.removeIndex('pedidos', ['id_usuario_creador']);
    await queryInterface.removeIndex('pedidos', ['estado_pedido']);
  }
};
