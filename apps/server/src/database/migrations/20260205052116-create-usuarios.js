'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      id_empresa: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'empresas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nombre_usuario: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      correo_electronico: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      clave_acceso: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      rol_usuario: {
        type: Sequelize.ENUM('Administrador', 'Vendedor'),
        allowNull: false
      },
      foto_perfil_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      estado_usuario: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuarios');
  }
};
