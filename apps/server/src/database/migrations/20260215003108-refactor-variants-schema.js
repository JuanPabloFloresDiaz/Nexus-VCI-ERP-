'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create producto_variantes table
    await queryInterface.createTable('producto_variantes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      id_producto: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'productos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sku: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      stock_actual: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      precio_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true // Can be null if inheriting from parent or not set
      },
      costo_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      imagen_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });

    // 2. Add id_variante to related tables

    // producto_detalles_filtros
    await queryInterface.addColumn('producto_detalles_filtros', 'id_variante', {
      type: Sequelize.UUID,
      allowNull: true, // Initially true to allow migration, then we should enforce
      references: {
        model: 'producto_variantes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // detalles_pedidos
    await queryInterface.addColumn('detalles_pedidos', 'id_variante', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'producto_variantes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // detalles_compras
    await queryInterface.addColumn('detalles_compras', 'id_variante', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'producto_variantes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 3. Remove columns from productos (Data loss warning: User approved)
    // We wrap in try/catch or checks if we were cautious, but user said "borre todos los datos"

    await queryInterface.removeColumn('productos', 'stock_actual');
    await queryInterface.removeColumn('productos', 'precio_unitario');
    await queryInterface.removeColumn('productos', 'costo_unitario');

    // Check if sku exists (it was added in a recent migration)
    try {
      await queryInterface.removeColumn('productos', 'sku');
    } catch (error) {
      console.warn('Column sku might not exist or already removed');
    }

    // Remove stock_inicial if it exists (added recently)
    try {
      await queryInterface.removeColumn('productos', 'stock_inicial');
    } catch (e) { }

    // 4. Update producto_detalles_filtros: Remove id_producto as it now links to variante
    // But wait, user said "usar esta tabla como variantes de producto".
    // Decision: Plan says "Modificar tabla producto_detalles_filtros (cambiar FK id_producto por id_variante)"
    // So yes, a filter option defines a VARIANT, not a PRODUCT.
    await queryInterface.removeColumn('producto_detalles_filtros', 'id_producto');

  },

  async down(queryInterface, Sequelize) {
    // Revert changes - complicated due to data loss structure
    // This is a destructive migration, down method is best effort or throws error

    // 1. Add columns back to productos
    await queryInterface.addColumn('productos', 'stock_actual', { type: Sequelize.INTEGER, defaultValue: 0 });
    await queryInterface.addColumn('productos', 'precio_unitario', { type: Sequelize.DECIMAL(10, 2) });
    await queryInterface.addColumn('productos', 'costo_unitario', { type: Sequelize.DECIMAL(10, 2) });
    await queryInterface.addColumn('productos', 'sku', { type: Sequelize.STRING(50) });

    // 2. Remove id_variante columns
    await queryInterface.removeColumn('detalles_compras', 'id_variante');
    await queryInterface.removeColumn('detalles_pedidos', 'id_variante');
    await queryInterface.removeColumn('producto_detalles_filtros', 'id_variante');

    // 3. Add id_producto back to producto_detalles_filtros
    await queryInterface.addColumn('producto_detalles_filtros', 'id_producto', {
      type: Sequelize.UUID,
      references: { model: 'productos', key: 'id' }
    });

    // 4. Drop table
    await queryInterface.dropTable('producto_variantes');
  }
};
