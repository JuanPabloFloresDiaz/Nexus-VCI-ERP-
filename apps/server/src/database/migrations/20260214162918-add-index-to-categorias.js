'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('categorias', ['id_empresa']);
    await queryInterface.addIndex('categorias', ['nombre_categoria']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('categorias', ['id_empresa']);
    await queryInterface.removeIndex('categorias', ['nombre_categoria']);
  }
};
