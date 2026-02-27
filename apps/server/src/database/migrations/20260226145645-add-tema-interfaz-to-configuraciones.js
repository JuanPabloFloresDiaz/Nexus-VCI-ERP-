'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('configuraciones_globales', 'tema_interfaz', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'nexusTheme'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('configuraciones_globales', 'tema_interfaz');
    }
};
