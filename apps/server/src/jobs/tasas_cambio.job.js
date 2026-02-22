const cron = require('node-cron');
const { Divisas, TasasCambio } = require('../models');

// Job programado cada día a las 4:00 AM (0 4 * * *)
const syncExchangeRatesJob = cron.schedule('0 4 * * *', async () => {
    console.log('[CRON JOB] Iniciando sincronización de tasas de cambio...');
    try {
        const apiUrl = 'https://open.er-api.com/v6/latest/USD';

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Error al conectar con ExchangeRate-API');
        }

        const data = await response.json();
        const rates = data.rates;

        const divisasDB = await Divisas.findAll();
        let actualizaciones = 0;

        for (const divisa of divisasDB) {
            const destinoISO = divisa.codigo_iso;
            if (destinoISO === 'USD') continue;

            if (rates[destinoISO]) {
                const tasaValor = rates[destinoISO];

                const existeTasa = await TasasCambio.findOne({
                    where: { codigo_iso_origen: 'USD', codigo_iso_destino: destinoISO }
                });

                if (existeTasa) {
                    await existeTasa.update({ tasa_cambio: tasaValor });
                    actualizaciones++;
                } else {
                    await TasasCambio.create({
                        codigo_iso_origen: 'USD',
                        codigo_iso_destino: destinoISO,
                        tasa_cambio: tasaValor
                    });
                    actualizaciones++;
                }
            }
        }

        console.log(`[CRON JOB] Sincronización completada. ${actualizaciones} tasas actualizadas.`);
    } catch (error) {
        console.error('[CRON JOB] Falla en sincronización de tasas de cambio:', error.message);
    }
}, {
    scheduled: false // Iniciar manualmente en app.js o similar
});

module.exports = syncExchangeRatesJob;
