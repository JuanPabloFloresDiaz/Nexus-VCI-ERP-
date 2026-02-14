'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('opciones_filtro', ['id_filtro']);
    await queryInterface.addIndex('opciones_filtro', ['valor_opcion']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('opciones_filtro', ['id_filtro']);
    await queryInterface.removeIndex('opciones_filtro', ['valor_opcion']);
  }
};
