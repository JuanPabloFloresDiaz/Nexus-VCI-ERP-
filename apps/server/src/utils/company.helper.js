const { Empresas } = require('../models');
const { minioClient, BUCKET_NAME } = require('../config/minio');

// Helper to convert stream to base64
const streamToBase64 = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
        stream.on('error', (err) => reject(err));
    });
};

/**
 * Fetches company data by ID, including the logo in Base64 if available.
 * @param {string} id_empresa - The ID of the company.
 * @returns {Promise<Object|null>} Company data object or null if not found.
 */
const fetchCompanyData = async (id_empresa) => {
    if (!id_empresa) return null;

    const empresa = await Empresas.findByPk(id_empresa);
    if (!empresa) return null;

    let logoBase64 = null;
    if (empresa.logo_url) {
        try {
            // Extract filename from URL (assuming last part is filename)
            const filename = empresa.logo_url.split('/').pop();
            const dataStream = await minioClient.getObject(BUCKET_NAME, filename);
            logoBase64 = await streamToBase64(dataStream);
        } catch (error) {
            console.error(`Error fetching logo for company ${id_empresa}:`, error.message);
        }
    }

    return {
        id: empresa.id,
        nombre_empresa: empresa.nombre_empresa,
        nit_empresa: empresa.nit_empresa,
        direccion_empresa: empresa.direccion_empresa,
        telefono_empresa: empresa.telefono_empresa,
        correo_empresa: empresa.correo_empresa,
        logoBase64
    };
};

module.exports = { fetchCompanyData };
