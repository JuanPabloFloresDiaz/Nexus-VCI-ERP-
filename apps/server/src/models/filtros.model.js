// src/models/filtros.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Filtros extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.belongsTo(models.Subcategorias, { foreignKey: 'id_subcategoria', as: 'subcategoria' });
        this.hasMany(models.OpcionesFiltro, { foreignKey: 'id_filtro', as: 'opciones' });
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
                id_subcategoria: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'subcategorias',
                        key: 'id'
                    }
                },
                nombre_filtro: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                tipo_dato: {
                    type: DataTypes.ENUM('Texto', 'Numérico', 'Lista'),
                    defaultValue: 'Texto'
                }
            },
            {
                sequelize,
                modelName: 'Filtros',
                tableName: 'filtros'
            }
        );
    }
}

module.exports = Filtros;
