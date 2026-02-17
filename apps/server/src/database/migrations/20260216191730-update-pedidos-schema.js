'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pedidos', 'id_almacen_origen', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'almacenes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pedidos', 'id_almacen_origen');
  }
};
