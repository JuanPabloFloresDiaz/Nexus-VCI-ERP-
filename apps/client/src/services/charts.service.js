import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'charts';

export async function getSalesByMonth () {
    return AxiosRequest(`${RESOURCE}/sales-by-month`, mapMethod('R'));
}

export async function getTopSellingProducts () {
    return AxiosRequest(`${RESOURCE}/top-selling-products`, mapMethod('R'));
}

export async function getClientsByState () {
    return AxiosRequest(`${RESOURCE}/sales-by-month`, mapMethod('R'));
}

export async function getOrdersByStatus () {
    return AxiosRequest(`${RESOURCE}/orders-by-status`, mapMethod('R'));
}

export async function getCategoryDistribution () {
    return AxiosRequest(`${RESOURCE}/category-distribution`, mapMethod('R'));
}
