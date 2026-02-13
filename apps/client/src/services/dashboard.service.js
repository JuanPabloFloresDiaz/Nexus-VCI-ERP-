import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'dashboard';

export async function getGeneralMetrics () {
    return AxiosRequest(`${RESOURCE}/metrics`, mapMethod('R'));
}

export async function getTopProducts () {
    return AxiosRequest(`${RESOURCE}/top-products`, mapMethod('R'));
}

export async function getTopClients () {
    return AxiosRequest(`${RESOURCE}/top-clients`, mapMethod('R'));
}
