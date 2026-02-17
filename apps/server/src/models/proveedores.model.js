// src/models/proveedores.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Proveedores extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.hasMany(models.Compras, { foreignKey: 'id_proveedor', as: 'compras' });
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
                nombre_proveedor: {
                    type: DataTypes.STRING(150),
                    allowNull: false
                },
                contacto_nombre: {
                    type: DataTypes.STRING(100),
                    allowNull: true
                },
                telefono_proveedor: {
                    type: DataTypes.STRING(15),
                    allowNull: true
                },
                correo_proveedor: {
                    type: DataTypes.STRING(100),
                    allowNull: true
                },
                nit_dui_proveedor: {
                    type: DataTypes.STRING(20),
                    allowNull: true
                },
                direccion_proveedor: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                dias_credito: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0
                }
            },
            {
                sequelize,
                modelName: 'Proveedores',
                tableName: 'proveedores'
            }
        );
    }
}

module.exports = Proveedores;
