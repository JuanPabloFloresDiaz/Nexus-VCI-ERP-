// src/models/compras.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Compras extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.belongsTo(models.Proveedores, { foreignKey: 'id_proveedor', as: 'proveedor' });
        this.belongsTo(models.Usuarios, { foreignKey: 'id_usuario_comprador', as: 'usuario_comprador' });
        this.hasMany(models.DetallesCompras, { foreignKey: 'id_compra', as: 'detalles' });
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
                id_proveedor: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'proveedores',
                        key: 'id'
                    }
                },
                id_usuario_comprador: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'usuarios',
                        key: 'id'
                    }
                },
                estado_compra: {
                    type: DataTypes.ENUM('Pendiente', 'Recibido', 'Cancelado'),
                    defaultValue: 'Pendiente'
                },
                total_compra: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0.00
                },
                fecha_entrega_estimada: {
                    type: DataTypes.DATEONLY,
                    allowNull: true
                }
            },
            {
                sequelize,
                modelName: 'Compras',
                tableName: 'compras'
            }
        );
    }
}

module.exports = Compras;
