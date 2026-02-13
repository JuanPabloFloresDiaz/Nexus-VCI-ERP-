import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'categorizacion';

// ==========================================
// CATEGORIAS
// ==========================================

export async function getCategorias (params) {
    return AxiosRequest(`${RESOURCE}/categorias`, mapMethod('R'), {}, params);
}

export async function getAllCategorias () {
    return AxiosRequest(`${RESOURCE}/categorias/all`, mapMethod('R'));
}

export async function createCategoria (payload) {
    return AxiosRequest(`${RESOURCE}/categorias`, mapMethod('C'), payload);
}

export async function bulkCreateCategorias (payload) {
    return AxiosRequest(`${RESOURCE}/categorias/bulk`, mapMethod('C'), payload);
}

export async function getCategoriaById (id) {
    return AxiosRequest(`${RESOURCE}/categorias/${id}`, mapMethod('R'));
}

export async function updateCategoria (id, payload) {
    return AxiosRequest(`${RESOURCE}/categorias/${id}`, mapMethod('U'), payload);
}

export async function deleteCategoria (id) {
    return AxiosRequest(`${RESOURCE}/categorias/${id}`, mapMethod('D'));
}

export async function restoreCategoria (id) {
    return AxiosRequest(`${RESOURCE}/categorias/${id}/restore`, mapMethod('U'));
}

export async function destroyCategoria (id) {
    return AxiosRequest(`${RESOURCE}/categorias/${id}/force`, mapMethod('D'));
}

// ==========================================
// SUBCATEGORIAS
// ==========================================

export async function getSubcategorias (params) {
    return AxiosRequest(`${RESOURCE}/subcategorias`, mapMethod('R'), {}, params);
}

export async function getSubcategoriasByCategoria (id) {
    return AxiosRequest(`${RESOURCE}/subcategorias/by-categoria/${id}`, mapMethod('R'));
}

export async function createSubcategoria (payload) {
    return AxiosRequest(`${RESOURCE}/subcategorias`, mapMethod('C'), payload);
}

export async function bulkCreateSubcategorias (payload) {
    return AxiosRequest(`${RESOURCE}/subcategorias/bulk`, mapMethod('C'), payload);
}

export async function updateSubcategoria (id, payload) {
    return AxiosRequest(`${RESOURCE}/subcategorias/${id}`, mapMethod('U'), payload);
}

export async function deleteSubcategoria (id) {
    return AxiosRequest(`${RESOURCE}/subcategorias/${id}`, mapMethod('D'));
}

export async function restoreSubcategoria (id) {
    return AxiosRequest(`${RESOURCE}/subcategorias/${id}/restore`, mapMethod('U'));
}

export async function destroySubcategoria (id) {
    return AxiosRequest(`${RESOURCE}/subcategorias/${id}/force`, mapMethod('D'));
}

export async function getTrashedCategorias (params) {
    return AxiosRequest(`${RESOURCE}/categorias/trashed`, mapMethod('R'), {}, params);
}

export async function getTrashedSubcategorias (params) {
    return AxiosRequest(`${RESOURCE}/subcategorias/trashed`, mapMethod('R'), {}, params);
}
