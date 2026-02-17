'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Obtener todas las variantes con su empresa
      const [variantes] = await queryInterface.sequelize.query(
        `SELECT v.id as id_variante, v.stock_actual, p.id_empresa 
         FROM producto_variantes v 
         JOIN productos p ON v.id_producto = p.id`,
        { transaction }
      );

      console.log(`📦 Procesando ${variantes.length} variantes...`);

      // Cache de almacenes por empresa para no consultar DB por cada variante
      const empresaAlmacenMap = {};
      const { randomUUID } = require('crypto');

      for (const variante of variantes) {
        let almacenId = empresaAlmacenMap[variante.id_empresa];

        // Si no tenemos cacheado el almacen de esta empresa, buscarlo
        if (!almacenId) {
          const [almacenes] = await queryInterface.sequelize.query(
            `SELECT id FROM almacenes WHERE id_empresa = '${variante.id_empresa}' AND nombre_almacen = 'Bodega Principal' LIMIT 1`,
            { transaction }
          );

          if (almacenes.length > 0) {
            almacenId = almacenes[0].id;
            empresaAlmacenMap[variante.id_empresa] = almacenId;
          } else {
            console.warn(`⚠️ ADVERTENCIA: La empresa ${variante.id_empresa} no tiene 'Bodega Principal'. Se omitirá su stock.`);
            continue; // Saltamos esta variante si no hay bodega
          }
        }

        // Insertar stock en almacén encontrado
        // Verificar si ya existe registro (idempotencia básica)
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM stock_almacenes WHERE id_variante = '${variante.id_variante}' AND id_almacen = '${almacenId}' LIMIT 1`,
          { transaction }
        );

        if (existing.length === 0) {
          await queryInterface.sequelize.query(
            `INSERT INTO stock_almacenes (id, id_variante, id_almacen, stock_actual, created_at, updated_at)
                VALUES ('${randomUUID()}', '${variante.id_variante}', '${almacenId}', ${variante.stock_actual || 0}, NOW(), NOW())`,
            { transaction }
          );
        }
      }

      console.log("✨ Stock migrado exitosamente.");

      // 2. Eliminar columna stock_actual de producto_variantes
      await queryInterface.removeColumn('producto_variantes', 'stock_actual', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error en migración de stock:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Recrear columna
      await queryInterface.addColumn('producto_variantes', 'stock_actual', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      }, { transaction });

      // 2. Restaurar stock sumando de todos los almacenes
      await queryInterface.sequelize.query(
        `UPDATE producto_variantes v 
         SET stock_actual = (
            SELECT COALESCE(SUM(s.stock_actual), 0) 
            FROM stock_almacenes s 
            WHERE s.id_variante = v.id
         )`,
        { transaction }
      );

      console.log("🔙 Stock restaurado en tabla variantes.");

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
