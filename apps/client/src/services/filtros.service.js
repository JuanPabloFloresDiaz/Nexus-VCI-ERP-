import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'filtros';

// ==========================================
// FILTROS
// ==========================================

export const getFiltros = async (params) => {
    return AxiosRequest(`${RESOURCE}/filtros`, mapMethod('R'), {}, params);
};

export const getFiltrosBySubcategoria = async (id) => {
    return AxiosRequest(`${RESOURCE}/filtros/by-subcategoria/${id}`, mapMethod('R'));
};

export const createFiltro = async (payload) => {
    return AxiosRequest(`${RESOURCE}/filtros`, mapMethod('C'), payload);
};

export const updateFiltro = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/filtros/${id}`, mapMethod('U'), payload);
};

export const deleteFiltro = async (id) => {
    return AxiosRequest(`${RESOURCE}/filtros/${id}`, mapMethod('D'));
};

export const restoreFiltro = async (id) => {
    return AxiosRequest(`${RESOURCE}/filtros/${id}/restore`, mapMethod('U'));
};

export const destroyFiltro = async (id) => {
    return AxiosRequest(`${RESOURCE}/filtros/${id}/force`, mapMethod('D'));
};

// ==========================================
// OPCIONES DE FILTRO
// ==========================================

export const getOpcionesFiltro = async (params) => {
    return AxiosRequest(`${RESOURCE}/opciones-filtro`, mapMethod('R'), {}, params);
};

export const createOpcionFiltro = async (payload) => {
    return AxiosRequest(`${RESOURCE}/opciones-filtro`, mapMethod('C'), payload);
};

export const bulkCreateOpcionesFiltro = async (payload) => {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/bulk-options`, mapMethod('C'), payload);
};

export const updateOpcionFiltro = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/${id}`, mapMethod('U'), payload);
};

export const deleteOpcionFiltro = async (id) => {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/${id}`, mapMethod('D'));
};

export const restoreOpcionFiltro = async (id) => {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/${id}/restore`, mapMethod('U'));
};

export const destroyOpcionFiltro = async (id) => {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/${id}/force`, mapMethod('D'));
};

export const getTrashedFiltros = async (params) => {
    return AxiosRequest(`${RESOURCE}/filtros/trashed`, mapMethod('R'), {}, params);
};

export const getTrashedOpcionesFiltro = async (params) => {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/trashed`, mapMethod('R'), {}, params);
};
