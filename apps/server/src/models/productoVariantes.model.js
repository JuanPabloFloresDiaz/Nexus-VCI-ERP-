const Sequelize = require('sequelize');
const { DataTypes } = Sequelize;

class ProductoVariantes extends Sequelize.Model {
    static initModel(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            id_producto: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'productos',
                    key: 'id'
                }
            },
            sku: {
                type: DataTypes.STRING(50),
                allowNull: true,
                unique: true
            },
            stock_actual: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            precio_unitario: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            costo_unitario: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            imagen_url: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            created_at: {
                allowNull: true,
                type: DataTypes.DATE
            },
            updated_at: {
                allowNull: true,
                type: DataTypes.DATE
            },
            deleted_at: {
                allowNull: true,
                type: DataTypes.DATE
            }
        }, {
            sequelize,
            tableName: 'producto_variantes',
            timestamps: true,
            paranoid: true,
            underscored: true,
            indexes: [
                {
                    name: "producto_variantes_pkey",
                    unique: true,
                    fields: [
                        { name: "id" },
                    ]
                },
                {
                    name: "idx_variantes_producto",
                    fields: [{ name: "id_producto" }]
                },
                {
                    name: "idx_variantes_sku",
                    unique: true,
                    fields: [{ name: "sku" }]
                }
            ]
        });
    }

    static associate(models) {
        ProductoVariantes.belongsTo(models.Productos, { foreignKey: "id_producto", as: "producto" });
        ProductoVariantes.hasMany(models.ProductoDetallesFiltros, { foreignKey: "id_variante", as: "detalles_filtros" });
        ProductoVariantes.hasMany(models.DetallesPedidos, { foreignKey: "id_variante", as: "pedidos" });
        ProductoVariantes.hasMany(models.DetallesCompras, { foreignKey: "id_variante", as: "compras" });
    }
}

module.exports = ProductoVariantes;
