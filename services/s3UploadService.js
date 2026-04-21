const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const getS3Client = require('../config/s3');

const MAX_FILE_SIZE_MB = Number(process.env.S3_MAX_FILE_SIZE_MB || 5);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const decodeBase64Image = (base64Payload) => {
    if (!base64Payload || typeof base64Payload !== 'string') {
        throw new Error('Imagen inválida');
    }

    const match = base64Payload.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
        throw new Error('Formato de imagen inválido. Use DataURL base64');
    }

    const mimeType = match[1];
    const data = match[2];

    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
        throw new Error('Tipo de imagen no permitido. Use JPG, PNG o WEBP');
    }

    const buffer = Buffer.from(data, 'base64');
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (buffer.length > maxBytes) {
        throw new Error(`La imagen supera ${MAX_FILE_SIZE_MB}MB`);
    }

    return { buffer, mimeType };
};

const getExtension = (mimeType) => {
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    return 'bin';
};

const buildPublicUrl = ({ bucket, region, key }) => {
    const customBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;
    if (customBaseUrl) {
        return `${customBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const uploadImageToS3 = async ({ base64DataUrl, folder }) => {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

    if (!bucket || !region) {
        throw new Error('Falta configuración S3: AWS_S3_BUCKET y AWS_S3_REGION');
    }

    const { buffer, mimeType } = decodeBase64Image(base64DataUrl);
    const extension = getExtension(mimeType);
    const safeFolder = (folder || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '');
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const key = `${safeFolder}/${fileName}`;

    const client = getS3Client();
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        })
    );

    return {
        key,
        url: buildPublicUrl({ bucket, region, key }),
    };
};

module.exports = { uploadImageToS3 };
