// src/models/empresas.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Empresas extends BaseEntity {
    static associate(models) {
        this.hasMany(models.Usuarios, { foreignKey: 'id_empresa', as: 'usuarios' });
        this.hasMany(models.Clientes, { foreignKey: 'id_empresa', as: 'clientes' });
        this.hasMany(models.Categorias, { foreignKey: 'id_empresa', as: 'categorias' });
        this.hasMany(models.Proveedores, { foreignKey: 'id_empresa', as: 'proveedores' });
        this.hasMany(models.Productos, { foreignKey: 'id_empresa', as: 'productos' });
        this.hasMany(models.Compras, { foreignKey: 'id_empresa', as: 'compras' });
        this.hasMany(models.Pedidos, { foreignKey: 'id_empresa', as: 'pedidos' });
        this.hasMany(models.Filtros, { foreignKey: 'id_empresa', as: 'filtros' });
    }

    static initModel(sequelize) {
        super.init(
            {
                nombre_empresa: {
                    type: DataTypes.STRING(150),
                    allowNull: false
                },
                nit_empresa: {
                    type: DataTypes.STRING(20),
                    allowNull: true
                },
                telefono_empresa: {
                    type: DataTypes.STRING(15),
                    allowNull: true
                },
                correo_empresa: {
                    type: DataTypes.STRING(100),
                    allowNull: true
                },
                direccion_empresa: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                logo_url: {
                    type: DataTypes.STRING(255),
                    allowNull: true
                }
            },
            {
                sequelize,
                modelName: 'Empresas',
                tableName: 'empresas'
            }
        );
    }
}

module.exports = Empresas;
