const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const getS3Client = require('../config/s3');

const MAX_FILE_SIZE_MB = Number(process.env.S3_MAX_FILE_SIZE_MB || 5);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const detectMimeTypeFromMagicBytes = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
        return null;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a;
    if (isPng) return 'image/png';

    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (isJpeg) return 'image/jpeg';

    // WEBP: RIFF....WEBP
    const isWebp =
        buffer[0] === 0x52 && // R
        buffer[1] === 0x49 && // I
        buffer[2] === 0x46 && // F
        buffer[3] === 0x46 && // F
        buffer[8] === 0x57 && // W
        buffer[9] === 0x45 && // E
        buffer[10] === 0x42 && // B
        buffer[11] === 0x50; // P
    if (isWebp) return 'image/webp';

    return null;
};

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

    const buffer = Buffer.from(data, 'base64');
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    const realMimeType = detectMimeTypeFromMagicBytes(buffer);
    if (!realMimeType) {
        throw new Error('Tipo de archivo inválido. Solo se permiten imágenes JPG, PNG o WEBP reales.');
    }

    if (!ALLOWED_IMAGE_TYPES.has(mimeType) || !ALLOWED_IMAGE_TYPES.has(realMimeType)) {
        throw new Error('Tipo de imagen no permitido. Use JPG, PNG o WEBP');
    }

    if (mimeType !== realMimeType) {
        throw new Error('El tipo de imagen declarado no coincide con el archivo real.');
    }

    if (buffer.length > maxBytes) {
        throw new Error(`La imagen supera ${MAX_FILE_SIZE_MB}MB`);
    }

    return { buffer, mimeType: realMimeType };
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
