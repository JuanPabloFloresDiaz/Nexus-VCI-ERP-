import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'movimientos';

export async function getMovimientos(params) {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
}

export async function getMovimientoById(id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
}

export async function createMovimiento(payload) {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
}

export async function transferir(payload) {
    return AxiosRequest(`${RESOURCE}/transferir`, mapMethod('C'), payload);
}

export async function updateMovimiento(id, payload) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
}

export async function deleteMovimiento(id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

export async function restoreMovimiento(id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
}

export async function forceDestroyMovimiento(id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}

export async function getTrashedMovimientos(params) {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
}