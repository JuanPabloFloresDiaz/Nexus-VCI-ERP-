'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('clientes', ['id_empresa']);
    await queryInterface.addIndex('clientes', ['nombre_cliente']);
    await queryInterface.addIndex('clientes', ['apellido_cliente']);
    await queryInterface.addIndex('clientes', ['correo_cliente']);
    await queryInterface.addIndex('clientes', ['telefono_cliente']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('clientes', ['id_empresa']);
    await queryInterface.removeIndex('clientes', ['nombre_cliente']);
    await queryInterface.removeIndex('clientes', ['apellido_cliente']);
    await queryInterface.removeIndex('clientes', ['correo_cliente']);
    await queryInterface.removeIndex('clientes', ['telefono_cliente']);
  }
};
