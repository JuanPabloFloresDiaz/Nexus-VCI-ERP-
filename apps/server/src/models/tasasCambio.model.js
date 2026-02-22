const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class TasasCambio extends BaseEntity {
    static associate(models) {
        this.belongsTo(models.Divisas, { foreignKey: 'codigo_iso_origen', targetKey: 'codigo_iso', as: 'divisa_origen' });
        this.belongsTo(models.Divisas, { foreignKey: 'codigo_iso_destino', targetKey: 'codigo_iso', as: 'divisa_destino' });
    }

    static initModel(sequelize) {
        super.init(
            {
                codigo_iso_origen: {
                    type: DataTypes.CHAR(3),
                    allowNull: false
                },
                codigo_iso_destino: {
                    type: DataTypes.CHAR(3),
                    allowNull: false
                },
                tasa_cambio: {
                    type: DataTypes.DECIMAL(15, 6),
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: 'TasasCambio',
                tableName: 'tasas_cambio'
            }
        );
    }
}

module.exports = TasasCambio;
