'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('compras', ['id_empresa']);
    await queryInterface.addIndex('compras', ['id_proveedor']);
    await queryInterface.addIndex('compras', ['id_usuario_comprador']);
    await queryInterface.addIndex('compras', ['estado_compra']);
    await queryInterface.addIndex('compras', ['fecha_entrega_estimada']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('compras', ['id_empresa']);
    await queryInterface.removeIndex('compras', ['id_proveedor']);
    await queryInterface.removeIndex('compras', ['id_usuario_comprador']);
    await queryInterface.removeIndex('compras', ['estado_compra']);
    await queryInterface.removeIndex('compras', ['fecha_entrega_estimada']);
  }
};
