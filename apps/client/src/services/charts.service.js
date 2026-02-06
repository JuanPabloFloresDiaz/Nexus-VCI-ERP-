import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'charts';

export const getSalesByMonth = async () => {
    return AxiosRequest(`${RESOURCE}/sales-by-month`, mapMethod('R'));
};

export const getTopSellingProducts = async () => {
    return AxiosRequest(`${RESOURCE}/top-selling-products`, mapMethod('R'));
};

export const getClientsByState = async () => {
    return AxiosRequest(`${RESOURCE}/sales-by-month`, mapMethod('R'));
};

export const getOrdersByStatus = async () => {
    return AxiosRequest(`${RESOURCE}/orders-by-status`, mapMethod('R'));
};

export const getCategoryDistribution = async () => {
    return AxiosRequest(`${RESOURCE}/category-distribution`, mapMethod('R'));
};
