'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('usuarios', ['id_empresa']);
    await queryInterface.addIndex('usuarios', ['nombre_usuario']);
    await queryInterface.addIndex('usuarios', ['rol_usuario']);
    await queryInterface.addIndex('usuarios', ['correo_electronico']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('usuarios', ['id_empresa']);
    await queryInterface.removeIndex('usuarios', ['nombre_usuario']);
    await queryInterface.removeIndex('usuarios', ['rol_usuario']);
    await queryInterface.removeIndex('usuarios', ['correo_electronico']);
  }
};
