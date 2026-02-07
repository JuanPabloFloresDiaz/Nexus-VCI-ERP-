import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'storage';

export const uploadFile = async (payload) => {
    return AxiosRequest(`${RESOURCE}/upload`, mapMethod('C'), payload);
};

export const getFile = async (filename, config = {}) => {
    return AxiosRequest(`${RESOURCE}/files/${filename}`, mapMethod('R'), {}, {}, config);
};

export const deleteFile = async (filename) => {
    return AxiosRequest(`${RESOURCE}/files/${filename}`, mapMethod('D'));
};
