// src/models/opcionesFiltro.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class OpcionesFiltro extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Filtros, { foreignKey: 'id_filtro', as: 'filtro' });
        this.hasMany(models.ProductoDetallesFiltros, { foreignKey: 'id_opcion_filtro', as: 'detalles_filtros' });
    }

    static initModel(sequelize) {
        super.init(
            {
                id_filtro: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'filtros',
                        key: 'id'
                    }
                },
                valor_opcion: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: 'OpcionesFiltro',
                tableName: 'opciones_filtro'
            }
        );
    }
}

module.exports = OpcionesFiltro;
