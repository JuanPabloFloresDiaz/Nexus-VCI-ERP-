import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'pedidos';

export async function getPedidos (params) {
    return AxiosRequest(`${RESOURCE}/pedidos`, mapMethod('R'), {}, params);
}

export async function getPedidoById (id) {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}`, mapMethod('R'));
}

export async function createPedido (payload) {
    return AxiosRequest(`${RESOURCE}/pedidos`, mapMethod('C'), payload);
}

export async function bulkCreatePedidos (payload) {
    return AxiosRequest(`${RESOURCE}/pedidos/bulk`, mapMethod('C'), payload);
}

export async function updatePedido (id, payload) {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}`, mapMethod('U'), payload);
}

export async function updateEstadoPedido (id, payload) {
    return AxiosRequest(`${RESOURCE}/pedidos/estado/${id}`, mapMethod('P'), payload);
}

export async function deletePedido (id) {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}`, mapMethod('D'));
}

export async function restorePedido (id) {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}/restore`, mapMethod('U'));
}

export async function destroyPedido (id) {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}/force`, mapMethod('D'));
}

export async function getTrashedPedidos (params) {
    return AxiosRequest(`${RESOURCE}/pedidos/trashed`, mapMethod('R'), {}, params);
}
