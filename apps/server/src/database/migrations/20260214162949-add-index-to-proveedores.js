'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('proveedores', ['id_empresa']);
    await queryInterface.addIndex('proveedores', ['nombre_proveedor']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('proveedores', ['id_empresa']);
    await queryInterface.removeIndex('proveedores', ['nombre_proveedor']);
  }
};
