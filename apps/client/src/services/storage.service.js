import AxiosRequest from './AxiosRequest';
import { mapMethod } from '../utils/MapMethod';

const RESOURCE = 'storage';

export const uploadFile = async (payload) => {
    return AxiosRequest(`${RESOURCE}/storage/upload`, mapMethod('C'), payload);
};

export const getFile = async (filename) => {
    return AxiosRequest(`${RESOURCE}/storage/files/${filename}`, mapMethod('R'));
};

export const deleteFile = async (filename) => {
    return AxiosRequest(`${RESOURCE}/storage/files/${filename}`, mapMethod('D'));
};
