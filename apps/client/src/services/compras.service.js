import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'compras';

export const getCompras = async (params) => {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
};

export const getCompraById = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
};

export const getTrashedCompras = async (params) => {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
};

export const createCompra = async (payload) => {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
};

export const createBulkCompras = async (payload) => {
    return AxiosRequest(`${RESOURCE}/bulk`, mapMethod('C'), payload);
};

export const updateCompra = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
};

export const restoreCompra = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
};

export const deleteCompra = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
};

export const forceDeleteCompra = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
};
