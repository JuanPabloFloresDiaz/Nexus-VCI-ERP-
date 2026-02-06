import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'clientes';

export const getClientes = async (params) => {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
};

export const getAllClientes = async () => {
    return AxiosRequest(`${RESOURCE}/all`, mapMethod('R'));
};

export const createCliente = async (payload) => {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
};

export const updateCliente = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
};

export const deleteCliente = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
};

export const restoreCliente = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
};

export const destroyCliente = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
};

export const createClientesBulk = async (data) => {
    return AxiosRequest(`${RESOURCE}/bulk`, mapMethod('C'), data);
};

export const getTrashedClientes = async (params) => {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
};

export const getClientePedidosHistory = async (id, params) => {
    return AxiosRequest(`${RESOURCE}/${id}/pedidos`, mapMethod('R'), {}, params);
};
