'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('proveedores', 'nit_dui_proveedor', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('proveedores', 'direccion_proveedor', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('proveedores', 'dias_credito', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Días de crédito otorgados para alertas de pago'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('proveedores', 'nit_dui_proveedor');
    await queryInterface.removeColumn('proveedores', 'direccion_proveedor');
    await queryInterface.removeColumn('proveedores', 'dias_credito');
  }
};
