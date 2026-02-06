import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'usuarios';

export const getUsuarios = async (params) => {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
};

export const getAllUsuarios = async () => {
    return AxiosRequest(`${RESOURCE}/all`, mapMethod('R'));
};

export const createUsuario = async (payload) => {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
};

export const updateUsuario = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
};

export const deleteUsuario = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
};

export const restoreUsuario = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('U'));
};

export const destroyUsuario = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
};

export const getTrashedUsuarios = async (params) => {
    return AxiosRequest(`${RESOURCE}/trashed`, mapMethod('R'), {}, params);
};
