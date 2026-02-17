// src/models/compras.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Compras extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.belongsTo(models.Proveedores, { foreignKey: 'id_proveedor', as: 'proveedor' });
        this.belongsTo(models.Usuarios, { foreignKey: 'id_usuario_comprador', as: 'usuario_comprador' });
        this.hasMany(models.DetallesCompras, { foreignKey: 'id_compra', as: 'detalles' });
        this.belongsTo(models.Almacenes, { foreignKey: 'id_almacen_destino', as: 'almacen_destino' });
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
                id_almacen_destino: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    references: {
                        model: 'almacenes',
                        key: 'id'
                    }
                },
                metodo_pago: {
                    type: DataTypes.ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Cheque', 'Credito'),
                    defaultValue: 'Efectivo'
                },
                referencia_pago: {
                    type: DataTypes.STRING(100),
                    allowNull: true
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
