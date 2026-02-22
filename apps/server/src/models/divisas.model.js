const { DataTypes } = require('sequelize');
const BaseEntity = require('./base.entity');

class Divisas extends BaseEntity {
    static associate(models) {
        this.hasMany(models.TasasCambio, { foreignKey: 'codigo_iso_origen', sourceKey: 'codigo_iso', as: 'tasas_origen' });
        this.hasMany(models.TasasCambio, { foreignKey: 'codigo_iso_destino', sourceKey: 'codigo_iso', as: 'tasas_destino' });
        this.hasMany(models.ConfiguracionesGlobales, { foreignKey: 'id_divisa_base', as: 'configuraciones' });
    }

    static initModel(sequelize) {
        super.init(
            {
                nombre_divisa: {
                    type: DataTypes.STRING(50),
                    allowNull: false
                },
                codigo_iso: {
                    type: DataTypes.CHAR(3),
                    allowNull: false,
                    unique: true
                },
                simbolo: {
                    type: DataTypes.STRING(5),
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: 'Divisas',
                tableName: 'divisas'
            }
        );
    }
}

module.exports = Divisas;
