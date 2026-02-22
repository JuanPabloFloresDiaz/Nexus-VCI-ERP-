'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('divisas', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      nombre_divisa: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      codigo_iso: {
        type: Sequelize.CHAR(3),
        allowNull: false,
        unique: true
      },
      simbolo: {
        type: Sequelize.STRING(5),
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

    // Seed Data using UUID() assuming it's MySQL compatible
    const [result] = await queryInterface.sequelize.query('SELECT UUID() as uuid');
    const getUuid = () => result[0].uuid; // Basic mock wait, bulkInsert needs actual values or literal.

    const divisas = [
      { id: Sequelize.literal('(SELECT UUID())'), nombre_divisa: 'Dólar Estadounidense', codigo_iso: 'USD', simbolo: '$' },
      { id: Sequelize.literal('(SELECT UUID())'), nombre_divisa: 'Quetzal Guatemalteco', codigo_iso: 'GTQ', simbolo: 'Q' },
      { id: Sequelize.literal('(SELECT UUID())'), nombre_divisa: 'Lempira Hondureño', codigo_iso: 'HNL', simbolo: 'L' },
      { id: Sequelize.literal('(SELECT UUID())'), nombre_divisa: 'Córdoba Nicaragüense', codigo_iso: 'NIO', simbolo: 'C$' },
      { id: Sequelize.literal('(SELECT UUID())'), nombre_divisa: 'Colón Costarricense', codigo_iso: 'CRC', simbolo: '₡' },
      { id: Sequelize.literal('(SELECT UUID())'), nombre_divisa: 'Balboa Panameño', codigo_iso: 'PAB', simbolo: 'B/.' }
    ];

    await queryInterface.bulkInsert('divisas', divisas);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('divisas');
  }
};
