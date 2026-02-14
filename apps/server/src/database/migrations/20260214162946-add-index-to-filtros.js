'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('filtros', ['id_empresa']);
    await queryInterface.addIndex('filtros', ['id_subcategoria']);
    await queryInterface.addIndex('filtros', ['nombre_filtro']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('filtros', ['id_empresa']);
    await queryInterface.removeIndex('filtros', ['id_subcategoria']);
    await queryInterface.removeIndex('filtros', ['nombre_filtro']);
  }
};
