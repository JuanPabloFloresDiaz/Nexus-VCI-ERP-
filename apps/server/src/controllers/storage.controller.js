const { minioClient, BUCKET_NAME } = require('../config/minio');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const crypto = require('crypto');
const path = require('path');

class StorageController {
    static routes = '/storage';

    static upload = catchErrors(async (req, res) => {
        if (!req.file) {
            return ApiResponse.error(res, {
                error: 'No se ha subido ningún archivo',
                status: 400,
                route: `${this.routes}/upload`
            });
        }

        const fileExtension = path.extname(req.file.originalname);
        const uniqueName = `${crypto.randomUUID()}${fileExtension}`;
        const metaData = {
            'Content-Type': req.file.mimetype
        };

        // Put object in MinIO
        await minioClient.putObject(
            BUCKET_NAME,
            uniqueName,
            req.file.buffer,
            req.file.size,
            metaData
        );

        // Construct internal URL for retrieval
        // Use relative path for frontend to query this API
        const fileUrl = `/api/storage/files/${uniqueName}`;

        return ApiResponse.success(res, {
            data: {
                url: fileUrl,
                filename: uniqueName,
                originalName: req.file.originalname
            },
            message: 'Archivo subido exitosamente',
            status: 201,
            route: `${this.routes}/upload`
        });
    });

    static getFile = catchErrors(async (req, res) => {
        const { filename } = req.params;

        try {
            const dataStream = await minioClient.getObject(BUCKET_NAME, filename);
            dataStream.pipe(res);
        } catch (err) {
            console.error('Error fetching file from MinIO:', err);
            return ApiResponse.error(res, {
                error: 'Archivo no encontrado',
                status: 404,
                route: `${this.routes}/files/${filename}`
            });
        }
    });

    static delete = catchErrors(async (req, res) => {
        const { filename } = req.params;

        await minioClient.removeObject(BUCKET_NAME, filename);

        return ApiResponse.success(res, {
            data: null,
            message: 'Archivo eliminado correctamente',
            status: 200,
            route: `${this.routes}/files/${filename}`
        });
    });

    // Helper method for internal use (e.g. from other controllers)
    static async deleteFileInternal(filename) {
        if (!filename) return;
        try {
            await minioClient.removeObject(BUCKET_NAME, filename);
            console.log(`Deleted file from storage: ${filename}`);
        } catch (err) {
            console.error(`Error deleting file ${filename} from storage:`, err);
        }
    }
}

module.exports = StorageController;
