/**
 * Utility functions for financial calculations on products
 */

export const calculateFinancials = (precio, costo, stock) => {
    const p = parseFloat(precio) || 0;
    const c = parseFloat(costo) || 0; // Costo Variable Unitario
    const q = parseInt(stock) || 0;

    // 1. Margen Unitario de Contribución (Price - Cost)
    const margenUnitario = p - c;

    // 2. Porcentaje de Margen (Profit Margin)
    // (P - C) / P
    const margenPorcentaje = p > 0 ? (margenUnitario / p) * 100 : 0;

    // 3. Markup (Sobrecosto)
    // (P - C) / C
    const markupPorcentaje = c > 0 ? (margenUnitario / c) * 100 : 0;

    // 4. Inversión Total en Inventario (Costo Total del Stock Actual)
    // CT_Stock = c * q
    const inversionTotal = c * q;

    // 5. Ingreso Total Potencial del Stock (Ventas Totales Proyectadas)
    // IT_Stock = p * q
    const ingresoTotalPotencial = p * q;

    // 6. Utilidad Total Potencial del Stock
    // U = IT - CT
    const utilidadTotalPotencial = ingresoTotalPotencial - inversionTotal;

    // 7. Punto de Equilibrio (Break-even Quantity to recover Investment)
    // Cuántas unidades debo vender para recuperar la inversión total del lote?
    // Inversión Total = Q_ventas * Precio
    // Q_equilibrio = Inversión Total / Precio
    // Esto asume que el costo ya está "pagado" (sunk cost) y queremos recuperar ese dinero.
    const puntoEquilibrioUnidades = p > 0 ? inversionTotal / p : 0;

    return {
        margenUnitario,
        margenPorcentaje,
        markupPorcentaje,
        inversionTotal,
        ingresoTotalPotencial,
        utilidadTotalPotencial,
        puntoEquilibrioUnidades
    };
};
