import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'usuarios';

export async function getUsuarios (params) {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
}

export async function getAllUsuarios () {
    return AxiosRequest(`${RESOURCE}/all`, mapMethod('R'));
}

export async function createUsuario (payload) {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
}

export async function updateUsuario (id, payload) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
}

export async function deleteUsuario (id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

export async function restoreUsuario (id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
}

export async function destroyUsuario (id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}

export async function getTrashedUsuarios (params) {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
}
