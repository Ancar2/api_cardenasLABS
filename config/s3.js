const { S3Client } = require('@aws-sdk/client-s3');

const getS3Client = () => {
    const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

    if (!region) {
        throw new Error('Falta AWS_S3_REGION o AWS_REGION para configurar S3');
    }

    return new S3Client({
        region,
        credentials:
            process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
                ? {
                      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                  }
                : undefined,
    });
};

module.exports = getS3Client;
