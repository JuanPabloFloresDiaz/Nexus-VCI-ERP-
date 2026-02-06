import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'dashboard';

export const getTotalSales = async (periodo) => {
    return AxiosRequest(`${RESOURCE}/sales?periodo=${periodo}`, mapMethod('R'));
};

export const getTotalProducts = async () => {
    return AxiosRequest(`${RESOURCE}/products`, mapMethod('R'));
};

export const getTopProducts = async () => {
    return AxiosRequest(`${RESOURCE}/top-products`, mapMethod('R'));
};

export const getTopClients = async () => {
    return AxiosRequest(`${RESOURCE}/top-clients`, mapMethod('R'));
};
