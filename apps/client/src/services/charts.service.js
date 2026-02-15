import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'charts';

export async function getDashboardStats(params = {}) {
    return AxiosRequest(`${RESOURCE}/stats`, mapMethod('R'), {}, params);
}

export async function getSalesHistory(params = {}) {
    return AxiosRequest(`${RESOURCE}/sales-history`, mapMethod('R'), {}, params);
}

export async function getTopProducts(params = {}) {
    return AxiosRequest(`${RESOURCE}/top-products`, mapMethod('R'), {}, params);
}

export async function getOrderStatus(params = {}) {
    return AxiosRequest(`${RESOURCE}/order-status`, mapMethod('R'), {}, params);
}

export async function getTopCategories(params = {}) {
    return AxiosRequest(`${RESOURCE}/top-categories`, mapMethod('R'), {}, params);
}
