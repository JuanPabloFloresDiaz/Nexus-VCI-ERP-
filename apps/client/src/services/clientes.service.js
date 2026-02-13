import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'clientes';

export async function getClientes (params) {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
}

export async function getAllClientes () {
    return AxiosRequest(`${RESOURCE}/all`, mapMethod('R'));
}

export async function createCliente (payload) {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
}

export async function updateCliente (id, payload) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
}

export async function deleteCliente (id) {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
}

export async function restoreCliente (id) {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
}

export async function destroyCliente (id) {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
}

export async function createClientesBulk (data) {
    return AxiosRequest(`${RESOURCE}/bulk`, mapMethod('C'), data);
}

export async function getTrashedClientes (params) {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
}

export async function getClientePedidosHistory (id, params) {
    return AxiosRequest(`${RESOURCE}/${id}/pedidos`, mapMethod('R'), {}, params);
}
