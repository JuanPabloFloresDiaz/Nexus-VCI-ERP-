const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Almacenes extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.hasMany(models.StockAlmacenes, { foreignKey: 'id_almacen', as: 'stock' });
        this.hasMany(models.MovimientosInventario, { foreignKey: 'id_almacen', as: 'movimientos' });
        // Relaciones con Compras y Pedidos
        this.hasMany(models.Compras, { foreignKey: 'id_almacen_destino', as: 'compras_recibidas' });
        this.hasMany(models.Pedidos, { foreignKey: 'id_almacen_origen', as: 'pedidos_despachados' });
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
                nombre_almacen: {
                    type: DataTypes.STRING(150),
                    allowNull: false
                },
                ubicacion: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                es_principal: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false
                }
            },
            {
                sequelize,
                modelName: 'Almacenes',
                tableName: 'almacenes'
            }
        );
    }
}

module.exports = Almacenes;
