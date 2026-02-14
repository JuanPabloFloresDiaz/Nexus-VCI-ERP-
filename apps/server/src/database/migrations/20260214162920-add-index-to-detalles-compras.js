'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('detalles_compras', ['id_compra']);
    await queryInterface.addIndex('detalles_compras', ['id_producto']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('detalles_compras', ['id_compra']);
    await queryInterface.removeIndex('detalles_compras', ['id_producto']);
  }
};
