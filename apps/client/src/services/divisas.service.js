import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'divisas';

export async function getDivisas(params) {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
}

export async function getDivisasList() {
    return AxiosRequest(`${RESOURCE}/select`, mapMethod('R'));
}

export async function getDivisaById(id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
}

export async function createDivisa(payload) {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
}

export async function updateDivisa(payload) {
    // Para simplificar la firma y ser consistente con otras funciones que envían payload completo
    const { id, ...data } = payload;
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), data);
}

export async function deleteDivisa(id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

export async function restoreDivisa(id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
}

export async function forceDestroyDivisa(id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}

export async function getTrashedDivisas(params) {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
}
