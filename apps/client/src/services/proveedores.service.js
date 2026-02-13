import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'proveedores';

export async function getProveedores (query = '') {
    return AxiosRequest(`${RESOURCE}?${query}`, mapMethod('R'));
}

export async function getProveedorById (id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
}

export async function getTrashedProveedores (query = '') {
    return AxiosRequest(`${RESOURCE}/trashed?${query}`, mapMethod('R'));
}

export async function createProveedor (payload) {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
}

export async function createBulkProveedores (payload) {
    return AxiosRequest(`${RESOURCE}/bulk`, mapMethod('C'), payload);
}

export async function updateProveedor (id, payload) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
}

export async function restoreProveedor (id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
}

export async function deleteProveedor (id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

export async function forceDeleteProveedor (id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}
