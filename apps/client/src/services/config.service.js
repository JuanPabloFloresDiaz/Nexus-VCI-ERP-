import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'config';

export async function getConfiguracionGlobal() {
    return AxiosRequest(RESOURCE, mapMethod('R'));
}

export async function updateConfiguracionGlobal(payload) {
    return AxiosRequest(RESOURCE, mapMethod('U'), payload);
}

export async function syncExchangeRates() {
    return AxiosRequest(`${RESOURCE}/sync-rates`, mapMethod('C'));
}
