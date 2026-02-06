// src/models/usuarios.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Usuarios extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.hasMany(models.Productos, { foreignKey: 'id_usuario_gestor', as: 'productos_gestionados' });
        this.hasMany(models.Compras, { foreignKey: 'id_usuario_comprador', as: 'compras_realizadas' });
        this.hasMany(models.Pedidos, { foreignKey: 'id_usuario_creador', as: 'pedidos_realizados' });
    }

    static initModel(sequelize) {
        super.init(
            {
                id_empresa: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'empresas',
                        key: 'id'
                    }
                },
                nombre_usuario: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                correo_electronico: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    unique: true
                },
                clave_acceso: {
                    type: DataTypes.STRING(255),
                    allowNull: false
                },
                rol_usuario: {
                    type: DataTypes.ENUM('Administrador', 'Vendedor', 'SuperAdministrador'),
                    allowNull: false
                },
                foto_perfil_url: {
                    type: DataTypes.STRING(255),
                    allowNull: true
                },
                estado_usuario: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true
                }
            },
            {
                sequelize,
                modelName: 'Usuarios',
                tableName: 'usuarios'
            }
        );
    }
}

module.exports = Usuarios;
