/**
 * Utility functions for financial calculations on products
 */

export function calculateFinancials (precio, costo, stockActual, stockInicial = null) {
    const p = Number.parseFloat(precio) || 0;
    const c = Number.parseFloat(costo) || 0; // Costo Variable Unitario
    const qActual = Number.parseInt(stockActual) || 0;
    // Use initial stock for investment/break-even if available, otherwise fallback to current
    const qInicial = stockInicial === null ? qActual : Number.parseInt(stockInicial) || 0;

    // 1. Margen Unitario de Contribución (Price - Cost)
    const margenUnitario = p - c;

    // 2. Porcentaje de Margen (Profit Margin)
    const margenPorcentaje = p > 0 ? (margenUnitario / p) * 100 : 0;

    // 3. Inversión Total (Based on INITIAL stock if provided, representing sunk cost of the batch)
    const inversionTotal = c * qInicial;

    // 4. Valor del Stock Actual (Inventory Value)
    const valorStockActual = c * qActual;

    // 5. Ingreso Total Potencial (If we sell EVERYTHING from the start, or just what's left?)
    // Usually "Potential of the Product Line" implies full batch. 
    // Let's return both: Total Potential (Initial) and Remaining Potential (Actual).
    const ingresoTotalPotencial = p * qInicial;
    const ingresoRestantePotencial = p * qActual;

    // 6. Utilidad Total Potencial (Projected Profit for the whole batch)
    const utilidadTotalPotencial = ingresoTotalPotencial - inversionTotal;

    // 7. Punto de Equilibrio (Break-even Quantity to recover Investment)
    // Cuántas unidades debo vender para recuperar la inversión total del lote?
    // Inversión Total = Q_ventas * Precio
    const puntoEquilibrioUnidades = p > 0 ? inversionTotal / p : 0;

    return {
        margenUnitario,
        margenPorcentaje,
        inversionTotal,       // Cost of Initial Stock
        valorStockActual,     // Cost of Current Stock
        ingresoTotalPotencial,// Revenue if all Initial Stock sold
        utilidadTotalPotencial, // Profit if all Initial Stock sold
        puntoEquilibrioUnidades,
        qInicial
    };
}
