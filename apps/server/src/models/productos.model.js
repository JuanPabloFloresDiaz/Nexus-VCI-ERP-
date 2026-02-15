// src/models/productos.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Productos extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.belongsTo(models.Subcategorias, { foreignKey: 'id_subcategoria', as: 'subcategoria' });
        this.belongsTo(models.Usuarios, { foreignKey: 'id_usuario_gestor', as: 'usuario_gestor' });
        this.hasMany(models.ProductoVariantes, { foreignKey: 'id_producto', as: 'variantes' });
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
                id_usuario_gestor: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'usuarios',
                        key: 'id'
                    }
                },
                nombre_producto: {
                    type: DataTypes.STRING(150),
                    allowNull: false
                },
                descripcion_producto: {
                    type: DataTypes.TEXT,
                    allowNull: false
                },
                imagen_url: {
                    type: DataTypes.STRING(255),
                    allowNull: true
                },
                estado_producto: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true
                }
            },
            {
                sequelize,
                modelName: 'Productos',
                tableName: 'productos'
            }
        );
    }
}

module.exports = Productos;
