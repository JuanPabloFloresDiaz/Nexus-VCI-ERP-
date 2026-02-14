'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('productos', ['id_empresa']);
    await queryInterface.addIndex('productos', ['id_subcategoria']);
    await queryInterface.addIndex('productos', ['id_usuario_gestor']);
    await queryInterface.addIndex('productos', ['nombre_producto']);
    await queryInterface.addIndex('productos', ['estado_producto']);
    await queryInterface.addIndex('productos', ['stock_actual']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('productos', ['id_empresa']);
    await queryInterface.removeIndex('productos', ['id_subcategoria']);
    await queryInterface.removeIndex('productos', ['id_usuario_gestor']);
    await queryInterface.removeIndex('productos', ['nombre_producto']);
    await queryInterface.removeIndex('productos', ['estado_producto']);
    await queryInterface.removeIndex('productos', ['stock_actual']);
  }
};
