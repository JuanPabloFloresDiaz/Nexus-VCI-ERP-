// src/models/clientes.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Clientes extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.hasMany(models.Pedidos, { foreignKey: 'id_cliente', as: 'pedidos' });
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
                nombre_cliente: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                apellido_cliente: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                dui_cliente: {
                    type: DataTypes.STRING(10),
                    allowNull: true
                },
                telefono_cliente: {
                    type: DataTypes.STRING(15),
                    allowNull: true
                },
                correo_cliente: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: 'Clientes',
                tableName: 'clientes'
            }
        );
    }
}

module.exports = Clientes;
