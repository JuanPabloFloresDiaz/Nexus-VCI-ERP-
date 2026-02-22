const { Model, DataTypes } = require('sequelize');

class ConfiguracionesGlobales extends Model {
    static associate(models) {
        this.belongsTo(models.Empresas, { foreignKey: 'id_empresa', as: 'empresa' });
        this.belongsTo(models.Divisas, { foreignKey: 'id_divisa_base', as: 'divisa_base' });
    }

    static initModel(sequelize) {
        ConfiguracionesGlobales.init(
            {
                id_empresa: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    primaryKey: true,
                    references: {
                        model: 'empresas',
                        key: 'id'
                    }
                },
                id_divisa_base: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'divisas',
                        key: 'id'
                    }
                }
            },
            {
                sequelize,
                modelName: 'ConfiguracionesGlobales',
                tableName: 'configuraciones_globales',
                timestamps: true,
                paranoid: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                deletedAt: 'deleted_at'
            }
        );
    }
}

module.exports = ConfiguracionesGlobales;
