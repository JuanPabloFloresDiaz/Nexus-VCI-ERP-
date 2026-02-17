import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'almacenes';

export async function getAlmacenes(params) {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
}

export async function getAlmacenById(id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
}

export async function getStock(id, params) {
    return AxiosRequest(`${RESOURCE}/${id}/stock`, mapMethod('R'), {}, params);
}

export async function createAlmacen(payload) {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
}

export async function updateAlmacen(id, payload) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
}

export async function deleteAlmacen(id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

export async function restoreAlmacen(id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
}

export async function forceDestroyAlmacen(id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}

export async function getTrashedAlmacenes(params) {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
}