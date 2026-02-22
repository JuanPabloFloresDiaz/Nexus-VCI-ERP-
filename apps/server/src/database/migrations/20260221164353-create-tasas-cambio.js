'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasas_cambio', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      codigo_iso_origen: {
        type: Sequelize.CHAR(3),
        allowNull: false
      },
      codigo_iso_destino: {
        type: Sequelize.CHAR(3),
        allowNull: false
      },
      tasa_cambio: {
        type: Sequelize.DECIMAL(15, 6),
        allowNull: false
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

    // Seed Data initial standard values (mock)
    const tasas = [
      { id: Sequelize.literal('(SELECT UUID())'), codigo_iso_origen: 'USD', codigo_iso_destino: 'GTQ', tasa_cambio: 7.80 },
      { id: Sequelize.literal('(SELECT UUID())'), codigo_iso_origen: 'USD', codigo_iso_destino: 'HNL', tasa_cambio: 24.60 },
      { id: Sequelize.literal('(SELECT UUID())'), codigo_iso_origen: 'USD', codigo_iso_destino: 'NIO', tasa_cambio: 36.60 },
      { id: Sequelize.literal('(SELECT UUID())'), codigo_iso_origen: 'USD', codigo_iso_destino: 'CRC', tasa_cambio: 512.00 },
      { id: Sequelize.literal('(SELECT UUID())'), codigo_iso_origen: 'USD', codigo_iso_destino: 'PAB', tasa_cambio: 1.00 },
    ];
    await queryInterface.bulkInsert('tasas_cambio', tasas);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tasas_cambio');
  }
};
