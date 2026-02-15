// src/models/productoDetallesFiltros.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class ProductoDetallesFiltros extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.ProductoVariantes, { foreignKey: 'id_variante', as: 'variante' });
        this.belongsTo(models.OpcionesFiltro, { foreignKey: 'id_opcion_filtro', as: 'opcion_filtro' });
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
                id_opcion_filtro: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'opciones_filtro',
                        key: 'id'
                    }
                }
            },
            {
                sequelize,
                modelName: 'ProductoDetallesFiltros',
                tableName: 'producto_detalles_filtros'
            }
        );
    }
}

module.exports = ProductoDetallesFiltros;
