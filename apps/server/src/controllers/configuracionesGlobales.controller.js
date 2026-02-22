const { ConfiguracionesGlobales, Divisas, TasasCambio } = require('../models');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');

class ConfiguracionesGlobalesController {
    static routes = '/config';

    static get = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;

        let config = await ConfiguracionesGlobales.findOne({
            where: { id_empresa },
            include: [{ model: Divisas, as: 'divisa_base', attributes: ['nombre_divisa', 'codigo_iso', 'simbolo'] }]
        });

        if (!config) {
            // Si la empresa no tiene configuración, se crea con USD por defecto
            const divisaBase = await Divisas.findOne({ where: { codigo_iso: 'USD' } });
            if (divisaBase) {
                config = await ConfiguracionesGlobales.create({
                    id_empresa,
                    id_divisa_base: divisaBase.id
                });
                // Recargar con la relación
                config = await ConfiguracionesGlobales.findOne({
                    where: { id_empresa },
                    include: [{ model: Divisas, as: 'divisa_base', attributes: ['nombre_divisa', 'codigo_iso', 'simbolo'] }]
                });
            } else {
                return ApiResponse.error(res, { error: 'No se encontró la configuración y no existe la divisa USD', status: 404 });
            }
        }

        return ApiResponse.success(res, {
            data: config,
            message: 'Configuración global obtenida correctamente',
            status: 200,
            route: this.routes
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const { id_divisa_base } = req.body;

        const config = await ConfiguracionesGlobales.findOne({ where: { id_empresa } });
        if (!config) {
            return ApiResponse.error(res, { error: 'Configuración no encontrada', status: 404 });
        }

        const divisa = await Divisas.findByPk(id_divisa_base);
        if (!divisa) {
            return ApiResponse.error(res, { error: 'Divisa no encontrada', status: 404 });
        }

        await config.update({ id_divisa_base });

        return ApiResponse.success(res, {
            data: config,
            message: 'Configuración global actualizada correctamente',
            status: 200,
            route: this.routes
        });
    });

    static syncRates = catchErrors(async (req, res) => {
        try {
            // Solo logica de syncRates utilizando exchangerate-api.com
            // Utilizando como base USD para obtener las tasas (puede ser dinámico si se requiere)
            const apiUrl = 'https://open.er-api.com/v6/latest/USD';

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Error al conectar con la API de ExchangeRate');
            }

            const data = await response.json();
            const rates = data.rates;

            // Obtener todas las divisas configuradas en la DB
            const divisasDB = await Divisas.findAll();

            for (const divisa of divisasDB) {
                const destinoISO = divisa.codigo_iso;
                if (destinoISO === 'USD') continue; // Se ignora porque USD vs USD es 1

                if (rates[destinoISO]) {
                    const tasaValor = rates[destinoISO];

                    // Comprobar si existe el par en la DB USD -> ISO
                    const existeTasa = await TasasCambio.findOne({
                        where: { codigo_iso_origen: 'USD', codigo_iso_destino: destinoISO }
                    });

                    if (existeTasa) {
                        await existeTasa.update({ tasa_cambio: tasaValor });
                    } else {
                        await TasasCambio.create({
                            codigo_iso_origen: 'USD',
                            codigo_iso_destino: destinoISO,
                            tasa_cambio: tasaValor
                        });
                    }
                }
            }

            return ApiResponse.success(res, {
                data: null,
                message: 'Tasas de cambio sincronizadas exitosamente',
                status: 200,
                route: `${this.routes}/sync-rates`
            });

        } catch (error) {
            return ApiResponse.error(res, {
                error: 'Error en sincronización de tasas: ' + error.message,
                status: 500,
                route: `${this.routes}/sync-rates`
            });
        }
    });
}

module.exports = ConfiguracionesGlobalesController;
