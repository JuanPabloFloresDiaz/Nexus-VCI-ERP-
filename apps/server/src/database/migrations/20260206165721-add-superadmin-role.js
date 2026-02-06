'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Modify the rol_usuario column to include 'SuperAdministrador'
    await queryInterface.changeColumn('usuarios', 'rol_usuario', {
      type: Sequelize.ENUM('Administrador', 'Vendedor', 'SuperAdministrador'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    await queryInterface.changeColumn('usuarios', 'rol_usuario', {
      type: Sequelize.ENUM('Administrador', 'Vendedor'),
      allowNull: false,
    });
  }
};
