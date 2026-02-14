'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('empresas', ['nombre_empresa']);
    await queryInterface.addIndex('empresas', ['nit_empresa']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('empresas', ['nombre_empresa']);
    await queryInterface.removeIndex('empresas', ['nit_empresa']);
  }
};
