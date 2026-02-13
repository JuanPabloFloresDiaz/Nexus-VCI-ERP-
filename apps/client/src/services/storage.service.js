import { mapMethod } from '../utils/MapMethod';
import AxiosRequest from './AxiosRequest';

const RESOURCE = 'storage';

export async function uploadFile (payload) {
    return AxiosRequest(`${RESOURCE}/upload`, mapMethod('C'), payload);
}

export async function getFile (filename, config = {}) {
    return AxiosRequest(`${RESOURCE}/files/${filename}`, mapMethod('R'), {}, {}, config);
}

export async function deleteFile (filename) {
    return AxiosRequest(`${RESOURCE}/files/${filename}`, mapMethod('D'));
}
