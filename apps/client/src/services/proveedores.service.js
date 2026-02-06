import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'proveedores';

export const getProveedores = async (params) => {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
};

export const getProveedorById = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
};

export const getTrashedProveedores = async (params) => {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
};

export const createProveedor = async (payload) => {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
};

export const createBulkProveedores = async (payload) => {
    return AxiosRequest(`${RESOURCE}/bulk`, mapMethod('C'), payload);
};

export const updateProveedor = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
};

export const restoreProveedor = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
};

export const deleteProveedor = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
};

export const forceDeleteProveedor = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
};
