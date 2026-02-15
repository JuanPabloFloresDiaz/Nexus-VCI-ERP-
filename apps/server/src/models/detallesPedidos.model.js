// src/models/detallesPedidos.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class DetallesPedidos extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Pedidos, { foreignKey: 'id_pedido', as: 'pedido' });
        this.belongsTo(models.Productos, { foreignKey: 'id_producto', as: 'producto' });
        this.belongsTo(models.ProductoVariantes, { foreignKey: 'id_variante', as: 'variante' });
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
                id_variante: {
                    type: DataTypes.UUID,
                    allowNull: true, // Should be false in future, but migration set true
                    references: {
                        model: 'producto_variantes',
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
