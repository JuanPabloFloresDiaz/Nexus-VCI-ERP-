import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'productos';

// ==========================================
// PRODUCTOS
// ==========================================

export const getProductos = async (params) => {
    return AxiosRequest(`${RESOURCE}/productos`, mapMethod('R'), {}, params);
};

export const getProductoById = async (id) => {
    return AxiosRequest(`${RESOURCE}/productos/${id}`, mapMethod('R'));
};

export const createProducto = async (payload) => {
    return AxiosRequest(`${RESOURCE}/productos`, mapMethod('C'), payload);
};

export const bulkCreateProductos = async (payload) => {
    return AxiosRequest(`${RESOURCE}/productos/bulk`, mapMethod('C'), payload);
};

export const updateProducto = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/productos/${id}`, mapMethod('U'), payload);
};

export const updateProductoStock = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/productos/stock/${id}`, mapMethod('P'), payload);
};

export const deleteProducto = async (id) => {
    return AxiosRequest(`${RESOURCE}/productos/${id}`, mapMethod('D'));
};

export const restoreProducto = async (id) => {
    return AxiosRequest(`${RESOURCE}/productos/${id}/restore`, mapMethod('U'));
};

export const destroyProducto = async (id) => {
    return AxiosRequest(`${RESOURCE}/productos/${id}/force`, mapMethod('D'));
};

// ==========================================
// DETALLES (Producto-Filtro)
// ==========================================

export const createProductoDetalle = async (payload) => {
    return AxiosRequest(`${RESOURCE}/producto-detalles`, mapMethod('C'), payload);
};

export const deleteProductoDetalle = async (id) => {
    return AxiosRequest(`${RESOURCE}/producto-detalles/${id}`, mapMethod('D'));
};

export const getTrashedProductos = async (params) => {
    return AxiosRequest(`${RESOURCE}/productos/trashed`, mapMethod('R'), {}, params);
};
