import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'reportes';

// Helper to trigger download
const downloadReport = async (url) => {
    // Para la descarga de archivos usualmente necesitamos responseType: 'blob'
    // AxiosRequest podría necesitar ajustes o usar una llamada dedicada si AxiosRequest envuelve JSON genérico.
    // Asumiendo que AxiosRequest maneja JSON estándar. Para blobs, podríamos necesitar omitirlo o agregar una opción.
    // Asumamos por ahora que usamos AxiosRequest pero un manejo específico podría ser necesario en el componente frontend.
    // SIN EMBARGO, el servicio típico solo devuelve la promesa.
    // Para manejar la descarga de blobs adecuadamente en AxiosRequest, necesitamos pasar la configuración.
    // Si AxiosRequest no admite la sobrescritura de configuración, podríamos necesitar importar axios directamente o modificar AxiosRequest.
    // Sigamos con la construcción de URL simple o un get básico por ahora, el usuario puede manejar el blob en el componente o actualizar AxiosRequest.
    // En realidad, los reportes usualmente devuelven un flujo/blob.
    // Implementemos métodos estándar.
    return AxiosRequest(url, mapMethod('R'), {}, {}, { responseType: 'blob' });
};

export const getCategorizationReport = async () => {
    return AxiosRequest(`${RESOURCE}/categorizacion`, mapMethod('R'), {}, {}, { responseType: 'blob' });
};

export const getProductsReport = async () => {
    return AxiosRequest(`${RESOURCE}/productos`, mapMethod('R'), {}, {}, { responseType: 'blob' });
};

export const getProductsByCategoryReport = async (id_categoria) => {
    return AxiosRequest(`${RESOURCE}/productos-categoria/${id_categoria}`, mapMethod('R'), {}, {}, { responseType: 'blob' });
};

export const getClientesReport = async () => {
    return AxiosRequest(`${RESOURCE}/clientes`, mapMethod('R'), {}, {}, { responseType: 'blob' });
};

export const getBitacoraPedidosReport = async (params) => { // fecha_inicio, fecha_fin
    return AxiosRequest(`${RESOURCE}/bitacora-pedidos`, mapMethod('R'), {}, params, { responseType: 'blob' });
};

export const getFacturaPedidoReport = async (id_pedido) => {
    return AxiosRequest(`${RESOURCE}/factura-pedido/${id_pedido}`, mapMethod('R'), {}, {}, { responseType: 'blob' });
};

export const getMasivoPedidosExcel = async (params) => { // fecha_inicio, fecha_fin
    return AxiosRequest(`${RESOURCE}/masivo-pedidos-excel`, mapMethod('R'), {}, params, { responseType: 'blob' }); // Excel download
};
