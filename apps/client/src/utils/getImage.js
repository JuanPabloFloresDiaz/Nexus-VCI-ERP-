import { getFile } from '../services/storage.service';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const imageCache = new Map();

/**
 * Fetches an image from the server and returns a Blob URL.
 * Uses a simple cache to prevent redundant network requests.
 * @param {string} path - The relative path or filename of the image.
 * @returns {Promise<string|null>} - Resolves to the object URL of the image, or null if failed.
 */
export const getImage = async (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;

    // Extract filename if path includes /api/storage/files/
    const filename = path.split('/').pop();

    if (imageCache.has(filename)) {
        return imageCache.get(filename);
    }

    try {
        // getFile in service returns a raw response if we configure it correctly, 
        // but AxiosRequest usually processes data. We might need a raw request here or specific service method.
        // Let's assume we use a direct axios call helper or modify service.
        // Actually, let's use the service but we need to ensure it returns blob.
        // The current AxiosRequest might try to parse JSON.

        // For simplicity and to avoid modifying AxiosRequest too much right now, 
        // let's do a tailored axios call here or use a dedicated method in service.
        // But user asked to use storage.service.js.

        // Let's assume getFile needs update to support blob response type.
        // checking storage.service.js... it uses AxiosRequest.

        const response = await getFile(filename, { responseType: 'blob' });

        // AxiosRequest returns response.data. If responseType is blob, response.data is the blob.
        if (response instanceof Blob) {
            const url = URL.createObjectURL(response);
            imageCache.set(filename, url);
            return url;
        } else if (response.data instanceof Blob) { // Just in case AxiosRequest wrapper structure
            const url = URL.createObjectURL(response.data);
            imageCache.set(filename, url);
            return url;
        }

    } catch (error) {
        console.error('Error loading image:', error);
    }
    return null;
};