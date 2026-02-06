import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'categorizacion';

// ==========================================
// CATEGORIAS
// ==========================================

export const getCategorias = async (params) => {
    return AxiosRequest(`${RESOURCE}/categorias`, mapMethod('R'), {}, params);
};

export const getAllCategorias = async () => {
    return AxiosRequest(`${RESOURCE}/categorias/all`, mapMethod('R'));
};

export const createCategoria = async (payload) => {
    return AxiosRequest(`${RESOURCE}/categorias`, mapMethod('C'), payload);
};

export const bulkCreateCategorias = async (payload) => {
    return AxiosRequest(`${RESOURCE}/categorias/bulk`, mapMethod('C'), payload);
};

export const updateCategoria = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/categorias/${id}`, mapMethod('U'), payload);
};

export const deleteCategoria = async (id) => {
    return AxiosRequest(`${RESOURCE}/categorias/${id}`, mapMethod('D'));
};

export const restoreCategoria = async (id) => {
    return AxiosRequest(`${RESOURCE}/categorias/${id}/restore`, mapMethod('U'));
};

export const destroyCategoria = async (id) => {
    return AxiosRequest(`${RESOURCE}/categorias/${id}/force`, mapMethod('D'));
};

// ==========================================
// SUBCATEGORIAS
// ==========================================

export const getSubcategorias = async (params) => {
    return AxiosRequest(`${RESOURCE}/subcategorias`, mapMethod('R'), {}, params);
};

export const getSubcategoriasByCategoria = async (id) => {
    return AxiosRequest(`${RESOURCE}/subcategorias/by-categoria/${id}`, mapMethod('R'));
};

export const createSubcategoria = async (payload) => {
    return AxiosRequest(`${RESOURCE}/subcategorias`, mapMethod('C'), payload);
};

export const bulkCreateSubcategorias = async (payload) => {
    return AxiosRequest(`${RESOURCE}/subcategorias/bulk`, mapMethod('C'), payload);
};

export const updateSubcategoria = async (id, payload) => {
    return AxiosRequest(`${RESOURCE}/subcategorias/${id}`, mapMethod('U'), payload);
};

export const deleteSubcategoria = async (id) => {
    return AxiosRequest(`${RESOURCE}/subcategorias/${id}`, mapMethod('D'));
};

export const restoreSubcategoria = async (id) => {
    return AxiosRequest(`${RESOURCE}/subcategorias/${id}/restore`, mapMethod('U'));
};

export const destroySubcategoria = async (id) => {
    return AxiosRequest(`${RESOURCE}/subcategorias/${id}/force`, mapMethod('D'));
};

export const getTrashedCategorias = async (params) => {
    return AxiosRequest(`${RESOURCE}/categorias/trashed`, mapMethod('R'), {}, params);
};

export const getTrashedSubcategorias = async (params) => {
    return AxiosRequest(`${RESOURCE}/subcategorias/trashed`, mapMethod('R'), {}, params);
};
