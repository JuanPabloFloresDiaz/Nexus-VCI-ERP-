// src/models/categorias.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Categorias extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.hasMany(models.Subcategorias, { foreignKey: 'id_categoria', as: 'subcategorias' });
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
                nombre_categoria: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                descripcion_categoria: {
                    type: DataTypes.TEXT,
                    allowNull: true
                }
            },
            {
                sequelize,
                modelName: 'Categorias',
                tableName: 'categorias'
            }
        );
    }
}

module.exports = Categorias;
