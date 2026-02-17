'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_almacenes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      stock_actual: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    // Indice único para evitar duplicados de variante en un mismo almacén
    await queryInterface.addConstraint('stock_almacenes', {
      fields: ['id_variante', 'id_almacen'],
      type: 'unique',
      name: 'unique_stock_variante_almacen'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('stock_almacenes');
  }
};
