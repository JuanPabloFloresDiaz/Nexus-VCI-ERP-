// src/models/detallesPedidos.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class DetallesPedidos extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Pedidos, { foreignKey: 'id_pedido', as: 'pedido' });
        this.belongsTo(models.Productos, { foreignKey: 'id_producto', as: 'producto' });
    }

    static initModel(sequelize) {
        super.init(
            {
                id_pedido: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'pedidos',
                        key: 'id'
                    }
                },
                id_producto: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'productos',
                        key: 'id'
                    }
                },
                cantidad: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    unsigned: true
                },
                precio_historico: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false
                },
                subtotal: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false
                },
                detalles_producto: {
                    type: DataTypes.JSON,
                    allowNull: true
                }
            },
            {
                sequelize,
                modelName: 'DetallesPedidos',
                tableName: 'detalles_pedidos'
            }
        );
    }
}

module.exports = DetallesPedidos;
