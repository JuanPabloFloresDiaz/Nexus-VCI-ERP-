const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_CONTAINER_NAME || 'minio',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER,
    secretKey: process.env.MINIO_ROOT_PASSWORD
});

const BUCKET_NAME = 'nexus-vci-erp-bucket';

// Initialize bucket
const initBucket = async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`Bucket '${BUCKET_NAME}' created successfully.`);

            // Set bucket policy to public read (optional, only if we want direct MinIO access)
            // For now we proxy via API so this might not be strictly needed, but good for debugging.
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
                    }
                ]
            };
            await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
            console.log('Bucket policy set to public read.');
        } else {
            console.log(`Bucket '${BUCKET_NAME}' already exists.`);
        }
    } catch (err) {
        console.error('Error initializing MinIO bucket:', err);
    }
};

module.exports = { minioClient, BUCKET_NAME, initBucket };
