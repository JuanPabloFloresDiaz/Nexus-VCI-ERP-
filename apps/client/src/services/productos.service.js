import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'productos';

// ==========================================
// PRODUCTOS
// ==========================================

export async function getProductos (params) {
    return AxiosRequest(`${RESOURCE}/productos`, mapMethod('R'), {}, params);
}

export async function getProductoById (id) {
    return AxiosRequest(`${RESOURCE}/productos/${id}`, mapMethod('R'));
}

export async function createProducto (payload) {
    return AxiosRequest(`${RESOURCE}/productos`, mapMethod('C'), payload);
}

export async function bulkCreateProductos (payload) {
    return AxiosRequest(`${RESOURCE}/productos/bulk`, mapMethod('C'), payload);
}

export async function updateProducto (id, payload) {
    return AxiosRequest(`${RESOURCE}/productos/${id}`, mapMethod('U'), payload);
}

export async function updateProductoStock (id, payload) {
    return AxiosRequest(`${RESOURCE}/productos/stock/${id}`, mapMethod('P'), payload);
}

export async function deleteProducto (id) {
    return AxiosRequest(`${RESOURCE}/productos/${id}`, mapMethod('D'));
}

export async function restoreProducto (id) {
    return AxiosRequest(`${RESOURCE}/productos/${id}/restore`, mapMethod('U'));
}

export async function destroyProducto (id) {
    return AxiosRequest(`${RESOURCE}/productos/${id}/force`, mapMethod('D'));
}

// ==========================================
// DETALLES (Producto-Filtro)
// ==========================================

export async function createProductoDetalle (payload) {
    return AxiosRequest(`${RESOURCE}/producto-detalles`, mapMethod('C'), payload);
}

export async function deleteProductoDetalle (id) {
    return AxiosRequest(`${RESOURCE}/producto-detalles/${id}`, mapMethod('D'));
}

export async function getTrashedProductos (params) {
    return AxiosRequest(`${RESOURCE}/productos/trashed`, mapMethod('R'), {}, params);
}
