'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('subcategorias', ['id_categoria']);
    await queryInterface.addIndex('subcategorias', ['nombre_subcategoria']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('subcategorias', ['id_categoria']);
    await queryInterface.removeIndex('subcategorias', ['nombre_subcategoria']);
  }
};
