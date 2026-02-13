import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'empresas';

export async function getEmpresas (query = '') {
    return AxiosRequest(`${RESOURCE}?${query}`, mapMethod('R'));
}

export async function getEmpresaById (id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
}

export async function createEmpresa (data) {
    return AxiosRequest(RESOURCE, mapMethod('C'), data);
}

export async function updateEmpresa (id, data) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), data);
}

export async function deleteEmpresa (id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

// New methods
export async function getEmpresaProfile () {
    return AxiosRequest(`${RESOURCE}/profile`, mapMethod('R'));
}

export async function updateEmpresaProfile (data) {
    return AxiosRequest(`${RESOURCE}/profile`, mapMethod('U'), data);
}

export async function getEmpresasSelect () {
    return AxiosRequest(`${RESOURCE}/select`, mapMethod('R'));
}

export const getAllEmpresas = getEmpresasSelect;

export async function getTrashedEmpresas (query = '') {
    return AxiosRequest(`${RESOURCE}/trashed?${query}`, mapMethod('R'));
}

export async function restoreEmpresa (id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('P')); // PATCH
}

export async function forceDeleteEmpresa (id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}
