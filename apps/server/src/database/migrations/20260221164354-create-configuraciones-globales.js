'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configuraciones_globales', {
      id_empresa: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        references: {
          model: 'empresas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_divisa_base: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'divisas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    // Seed Data: Assing USD configuration to all existing companies
    const [divisas] = await queryInterface.sequelize.query(
      `SELECT id FROM divisas WHERE codigo_iso = 'USD' LIMIT 1;`
    );

    if (divisas && divisas.length > 0) {
      const usdId = divisas[0].id;

      const [empresas] = await queryInterface.sequelize.query(
        `SELECT id FROM empresas WHERE deleted_at IS NULL;`
      );

      if (empresas && empresas.length > 0) {
        const configs = empresas.map(empresa => ({
          id_empresa: empresa.id,
          id_divisa_base: usdId
        }));

        await queryInterface.bulkInsert('configuraciones_globales', configs);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('configuraciones_globales');
  }
};
