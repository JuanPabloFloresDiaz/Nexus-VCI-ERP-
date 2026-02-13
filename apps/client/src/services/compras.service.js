import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'compras';

export async function getCompras (params) {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
}

export async function getCompraById (id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
}

export async function getTrashedCompras (params) {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
}

export async function createCompra (payload) {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
}

export async function createBulkCompras (payload) {
    return AxiosRequest(`${RESOURCE}/bulk`, mapMethod('C'), payload);
}

export async function updateCompra (id, payload) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
}

export async function restoreCompra (id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
}

export async function deleteCompra (id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

export async function forceDeleteCompra (id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}
