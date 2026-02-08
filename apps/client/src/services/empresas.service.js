import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'empresas';

export const getEmpresas = async (query = '') => {
    return AxiosRequest(`${RESOURCE}?${query}`, mapMethod('R'));
};

export const getEmpresaById = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('R'));
};

export const createEmpresa = async (data) => {
    return AxiosRequest(RESOURCE, mapMethod('C'), data);
};

export const updateEmpresa = async (id, data) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('U'), data);
};

export const deleteEmpresa = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}`, mapMethod('D'));
};

// New methods
export const getEmpresaProfile = async () => {
    return AxiosRequest(`${RESOURCE}/profile`, mapMethod('R'));
};

export const updateEmpresaProfile = async (data) => {
    return AxiosRequest(`${RESOURCE}/profile`, mapMethod('U'), data);
};

export const getEmpresasSelect = async () => {
    return AxiosRequest(`${RESOURCE}/select`, mapMethod('R'));
};

export const getAllEmpresas = getEmpresasSelect;

export const getTrashedEmpresas = async (query = '') => {
    return AxiosRequest(`${RESOURCE}/trashed?${query}`, mapMethod('R'));
};

export const restoreEmpresa = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/restore`, mapMethod('P')); // PATCH
};

export const forceDeleteEmpresa = async (id) => {
    return AxiosRequest(`${RESOURCE}/${id}/force`, mapMethod('D'));
};
