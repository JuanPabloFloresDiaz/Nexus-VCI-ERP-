import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'empresas';

export const getEmpresas = async (params) => {
    return AxiosRequest(RESOURCE, mapMethod('R'), {}, params);
};

export const getEmpresaById = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
};

export const createEmpresa = async (payload) => {
    return AxiosRequest(RESOURCE, mapMethod('C'), payload);
};

export const updateEmpresa = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), payload);
};

export const deleteEmpresa = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
};
