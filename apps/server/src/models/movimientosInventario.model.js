const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class MovimientosInventario extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.belongsTo(models.Almacenes, { foreignKey: 'id_almacen', as: 'almacen' });
        this.belongsTo(models.ProductoVariantes, { foreignKey: 'id_variante', as: 'variante' });
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
                id_variante: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'producto_variantes',
                        key: 'id'
                    }
                },
                id_almacen: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'almacenes',
                        key: 'id'
                    }
                },
                tipo_movimiento: {
                    type: DataTypes.ENUM('Compra', 'Venta', 'Ajuste', 'Traslado'),
                    allowNull: false
                },
                cantidad: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    comment: 'Positivo para entrada, Negativo para salida'
                },
                costo_unitario: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: true
                },
                id_referencia: {
                    type: DataTypes.UUID, // ID de Compra, Pedido o Movimiento relacionado
                    allowNull: true
                },
                fecha_movimiento: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW
                }
            },
            {
                sequelize,
                modelName: 'MovimientosInventario',
                tableName: 'movimientos_inventario'
            }
        );
    }
}

module.exports = MovimientosInventario;
