import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'filtros';

// ==========================================
// FILTROS
// ==========================================

export async function getFiltros (params) {
    return AxiosRequest(`${RESOURCE}/filtros`, mapMethod('R'), {}, params);
}

export async function getFiltrosBySubcategoria (id) {
    return AxiosRequest(`${RESOURCE}/filtros/by-subcategoria/${id}`, mapMethod('R'));
}

export async function createFiltro (payload) {
    return AxiosRequest(`${RESOURCE}/filtros`, mapMethod('C'), payload);
}

export async function updateFiltro (id, payload) {
    return AxiosRequest(`${RESOURCE}/filtros/${id}`, mapMethod('U'), payload);
}

export async function deleteFiltro (id) {
    return AxiosRequest(`${RESOURCE}/filtros/${id}`, mapMethod('D'));
}

export async function restoreFiltro (id) {
    return AxiosRequest(`${RESOURCE}/filtros/${id}/restore`, mapMethod('U'));
}

export async function destroyFiltro (id) {
    return AxiosRequest(`${RESOURCE}/filtros/${id}/force`, mapMethod('D'));
}

// ==========================================
// OPCIONES DE FILTRO
// ==========================================

export async function getOpcionesFiltro (params) {
    return AxiosRequest(`${RESOURCE}/opciones-filtro`, mapMethod('R'), {}, params);
}

export async function createOpcionFiltro (payload) {
    return AxiosRequest(`${RESOURCE}/opciones-filtro`, mapMethod('C'), payload);
}

export async function bulkCreateOpcionesFiltro (payload) {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/bulk-options`, mapMethod('C'), payload);
}

export async function updateOpcionFiltro (id, payload) {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/${id}`, mapMethod('U'), payload);
}

export async function deleteOpcionFiltro (id) {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/${id}`, mapMethod('D'));
}

export async function restoreOpcionFiltro (id) {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/${id}/restore`, mapMethod('U'));
}

export async function destroyOpcionFiltro (id) {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/${id}/force`, mapMethod('D'));
}

export async function getTrashedFiltros (params) {
    return AxiosRequest(`${RESOURCE}/filtros/trashed`, mapMethod('R'), {}, params);
}

export async function getTrashedOpcionesFiltro (params) {
    return AxiosRequest(`${RESOURCE}/opciones-filtro/trashed`, mapMethod('R'), {}, params);
}
