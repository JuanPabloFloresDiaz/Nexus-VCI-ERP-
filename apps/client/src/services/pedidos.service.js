import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'pedidos';

export const getPedidos = async (params) => {
    return AxiosRequest(`${RESOURCE}/pedidos`, mapMethod('R'), {}, params);
};

export const getPedidoById = async (id) => {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}`, mapMethod('R'));
};

export const createPedido = async (payload) => {
    return AxiosRequest(`${RESOURCE}/pedidos`, mapMethod('C'), payload);
};

export const bulkCreatePedidos = async (payload) => {
    return AxiosRequest(`${RESOURCE}/pedidos/bulk`, mapMethod('C'), payload);
};

export const updateEstadoPedido = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/pedidos/estado/${id}`, mapMethod('P'), payload);
};

export const deletePedido = async (id) => {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}`, mapMethod('D'));
};

export const restorePedido = async (id) => {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}/restore`, mapMethod('U'));
};

export const destroyPedido = async (id) => {
    return AxiosRequest(`${RESOURCE}/pedidos/${id}/force`, mapMethod('D'));
};

export const getTrashedPedidos = async (params) => {
    return AxiosRequest(`${RESOURCE}/pedidos/trashed`, mapMethod('R'), {}, params);
};
