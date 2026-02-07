import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'dashboard';

export const getGeneralMetrics = async () => {
    return AxiosRequest(`${RESOURCE}/metrics`, mapMethod('R'));
};

export const getTopProducts = async () => {
    return AxiosRequest(`${RESOURCE}/top-products`, mapMethod('R'));
};

export const getTopClients = async () => {
    return AxiosRequest(`${RESOURCE}/top-clients`, mapMethod('R'));
};
