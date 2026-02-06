import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'auth';

export const authLogin = async (payload) => {
    return AxiosRequest(`${RESOURCE}/login`, mapMethod('C'), payload);
};

export const authRegister = async (payload) => {
    return AxiosRequest(`${RESOURCE}/register`, mapMethod('C'), payload);
};
