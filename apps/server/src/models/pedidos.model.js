// src/models/pedidos.model.js
const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Pedidos extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.belongsTo(models.Clientes, { foreignKey: 'id_cliente', as: 'cliente' });
        this.belongsTo(models.Usuarios, { foreignKey: 'id_usuario_creador', as: 'usuario_creador' });
        this.hasMany(models.DetallesPedidos, { foreignKey: 'id_pedido', as: 'detalles' });
        this.belongsTo(models.Almacenes, { foreignKey: 'id_almacen_origen', as: 'almacen_origen' });
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
                id_cliente: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'clientes',
                        key: 'id'
                    }
                },
                id_usuario_creador: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'usuarios',
                        key: 'id'
                    }
                },
                id_almacen_origen: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    references: {
                        model: 'almacenes',
                        key: 'id'
                    }
                },
                estado_pedido: {
                    type: DataTypes.ENUM('Pendiente', 'Completado', 'Cancelado'),
                    defaultValue: 'Pendiente'
                },
                total_pedido: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0.00
                },
            },
            {
                sequelize,
                modelName: 'Pedidos',
                tableName: 'pedidos'
            }
        );
    }
}

module.exports = Pedidos;
