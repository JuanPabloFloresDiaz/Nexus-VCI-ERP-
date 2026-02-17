'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('producto_variantes', 'stock_minimo', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 5
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('producto_variantes', 'stock_minimo');
  }
};
