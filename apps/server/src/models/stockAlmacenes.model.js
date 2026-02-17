const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class StockAlmacenes extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Almacenes, { foreignKey: 'id_almacen', as: 'almacen' });
        this.belongsTo(models.ProductoVariantes, { foreignKey: 'id_variante', as: 'variante' });
    }

    static initModel(sequelize) {
        super.init(
            {
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
                stock_actual: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0,
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: 'StockAlmacenes',
                tableName: 'stock_almacenes',
                indexes: [
                    {
                        unique: true,
                        fields: ['id_variante', 'id_almacen'],
                    },
                ],
            }
        );
    }
}

module.exports = StockAlmacenes;
