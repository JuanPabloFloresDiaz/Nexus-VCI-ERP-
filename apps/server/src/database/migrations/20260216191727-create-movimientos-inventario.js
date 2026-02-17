'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movimientos_inventario', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      id_empresa: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'empresas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_variante: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'producto_variantes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_almacen: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'almacenes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tipo_movimiento: {
        type: Sequelize.ENUM('Compra', 'Venta', 'Ajuste', 'Traslado'),
        allowNull: false,
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Positivo para entrada, Negativo para salida'
      },
      costo_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      id_referencia: {
        type: Sequelize.UUID, // ID de Compra, Pedido o Movimiento relacionado
        allowNull: true,
      },
      fecha_movimiento: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('movimientos_inventario', ['id_variante']);
    await queryInterface.addIndex('movimientos_inventario', ['id_almacen']);
    await queryInterface.addIndex('movimientos_inventario', ['fecha_movimiento']);
    await queryInterface.addIndex('movimientos_inventario', ['id_empresa']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('movimientos_inventario');
  }
};
