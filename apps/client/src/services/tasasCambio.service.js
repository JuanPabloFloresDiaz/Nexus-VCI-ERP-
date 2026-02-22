import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'tasas-cambio';

export async function getTasasCambio(params) {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
}

export async function getTasaCambioById(id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
}

export async function createTasaCambio(payload) {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
}

export async function updateTasaCambio(payload) {
    const { id, ...data } = payload;
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), data);
}

export async function deleteTasaCambio(id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

export async function restoreTasaCambio(id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
}

export async function forceDestroyTasaCambio(id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}

export async function getTrashedTasasCambio(params) {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
}
