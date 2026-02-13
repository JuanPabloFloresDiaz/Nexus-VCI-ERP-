import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'auth';

export async function authLogin (payload) {
    return AxiosRequest(`${RESOURCE}/login`, mapMethod('C'), payload);
}

export async function authRegister (payload) {
    return AxiosRequest(`${RESOURCE}/register`, mapMethod('C'), payload);
}
