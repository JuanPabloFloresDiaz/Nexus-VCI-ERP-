'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('producto_detalles_filtros', ['id_producto']);
    await queryInterface.addIndex('producto_detalles_filtros', ['id_opcion_filtro']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('producto_detalles_filtros', ['id_producto']);
    await queryInterface.removeIndex('producto_detalles_filtros', ['id_opcion_filtro']);
  }
};
