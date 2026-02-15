import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'compras';

export async function getCompras(params) {
    return AxiosRequest(`${RESOURCE}/compras`, mapMethod('R'), {}, params);
}

export async function getCompraById(id) {
    return AxiosRequest(`${RESOURCE}/compras/${id}`, mapMethod('R'));
}

export async function getTrashedCompras(params) {
    return AxiosRequest(`${RESOURCE}/compras/trashed`, mapMethod('R'), {}, params);
}

export async function createCompra(payload) {
    return AxiosRequest(`${RESOURCE}/compras`, mapMethod('C'), payload);
}

export async function createBulkCompras(payload) {
    return AxiosRequest(`${RESOURCE}/compras/bulk`, mapMethod('C'), payload);
}

export async function updateCompra(id, payload) {
    return AxiosRequest(`${RESOURCE}/compras/${id}`, mapMethod('U'), payload);
}

export async function restoreCompra(id) {
    return AxiosRequest(`${RESOURCE}/compras/${id}/restore`, mapMethod('U'));
}

export async function deleteCompra(id) {
    return AxiosRequest(`${RESOURCE}/compras/${id}`, mapMethod('D'));
}

export async function forceDeleteCompra(id) {
    return AxiosRequest(`${RESOURCE}/compras/${id}/force`, mapMethod('D'));
}
