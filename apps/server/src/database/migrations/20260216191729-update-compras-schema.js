'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('compras', 'id_almacen_destino', {
      type: Sequelize.UUID,
      allowNull: true, // Nullable inicialmente, pero idealmente requerido
      references: {
        model: 'almacenes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('compras', 'metodo_pago', {
      type: Sequelize.ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Cheque', 'Credito'),
      defaultValue: 'Efectivo',
      allowNull: true,
    });
    await queryInterface.addColumn('compras', 'referencia_pago', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Número de cheque, transacción o factura'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('compras', 'id_almacen_destino');
    await queryInterface.removeColumn('compras', 'metodo_pago');
    await queryInterface.removeColumn('compras', 'referencia_pago');
  }
};
