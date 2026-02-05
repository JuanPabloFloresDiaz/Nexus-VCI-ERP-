// src/models/subcategorias.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Subcategorias extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Categorias, { foreignKey: 'id_categoria', as: 'categoria' });
        this.hasMany(models.Productos, { foreignKey: 'id_subcategoria', as: 'productos' });
        this.hasMany(models.Filtros, { foreignKey: 'id_subcategoria', as: 'filtros' });
    }

    static initModel(sequelize) {
        super.init(
            {
                id_categoria: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'categorias',
                        key: 'id'
                    }
                },
                nombre_subcategoria: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: 'Subcategorias',
                tableName: 'subcategorias'
            }
        );
    }
}

module.exports = Subcategorias;
