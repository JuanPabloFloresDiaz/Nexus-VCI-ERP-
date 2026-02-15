// src/models/detallesCompras.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class DetallesCompras extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Compras, { foreignKey: 'id_compra', as: 'compra' });
        this.belongsTo(models.Productos, { foreignKey: 'id_producto', as: 'producto' });
        this.belongsTo(models.ProductoVariantes, { foreignKey: 'id_variante', as: 'variante' });
    }

    static initModel(sequelize) {
        super.init(
            {
                id_compra: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'compras',
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
                    allowNull: true,
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
                precio_costo_historico: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false
                },
                subtotal: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: 'DetallesCompras',
                tableName: 'detalles_compras'
            }
        );
    }
}

module.exports = DetallesCompras;
