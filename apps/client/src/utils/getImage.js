import { getFile } from '../services/storage.service';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;



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

    // Cache removed to prevent revocations issues with AsyncAvatar

    try {
        const response = await getFile(filename, { responseType: 'blob' });

        if (response instanceof Blob) {
            return URL.createObjectURL(response);
        } else if (response.data instanceof Blob) {
            return URL.createObjectURL(response.data);
        }

    } catch (error) {
        console.error('Error loading image:', error);
    }
    return null;
};