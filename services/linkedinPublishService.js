const LINKEDIN_UGC_POSTS_URL = process.env.LINKEDIN_POSTS_URL || 'https://api.linkedin.com/v2/ugcPosts';
const LINKEDIN_REGISTER_UPLOAD_URL =
    process.env.LINKEDIN_REGISTER_UPLOAD_URL || 'https://api.linkedin.com/v2/assets?action=registerUpload';

const buildProfessionalReviewText = ({ review, rating }) => {
    const website = process.env.LINKEDIN_CTA_URL || 'https://cardenaslabs.com';
    const brand = process.env.LINKEDIN_BRAND_TAG || '@CardenasLabs';

    return [
        'Mi reseña con el equipo de CardenasLabs fue:',
        '',
        `"${review}"`,
        '',
        `Calificación: ${rating}/5`,
        '',
        `LinkedIn: ${brand}.`,
        `Conoce más en: ${website}`,
        '',
        '#SoftwareDevelopment #WebDevelopment #UX #ProductEngineering #CardenasLabs',
    ].join('\n');
};

const uploadImageToLinkedinAsset = async ({ accessToken, linkedinSub }) => {
    const clientUrl = String(process.env.CLIENT_URL || '').replace(/\/+$/, '');
    const imageUrl = process.env.LINKEDIN_REVIEW_IMAGE_URL || `${clientUrl}/home-captura.png`;
    const owner = `urn:li:person:${linkedinSub}`;

    const registerPayload = {
        registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner,
            serviceRelationships: [
                {
                    relationshipType: 'OWNER',
                    identifier: 'urn:li:userGeneratedContent',
                },
            ],
        },
    };

    const registerResponse = await fetch(LINKEDIN_REGISTER_UPLOAD_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(registerPayload),
    });

    if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        throw new Error(`LinkedIn registerUpload error: ${errorText}`);
    }

    const registerJson = await registerResponse.json();
    const uploadMechanism =
        registerJson?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
    const uploadUrl = uploadMechanism?.uploadUrl;
    const asset = registerJson?.value?.asset;

    if (!uploadUrl || !asset) {
        throw new Error('LinkedIn registerUpload no devolvió uploadUrl o asset');
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error(`No se pudo descargar la imagen para LinkedIn desde ${imageUrl}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
        },
        body: imageBuffer,
    });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`LinkedIn image upload error: ${errorText}`);
    }

    return { asset, imageUrl };
};

const publishToLinkedin = async ({ accessToken, linkedinSub, review, rating }) => {
    const author = `urn:li:person:${linkedinSub}`;
    const text = buildProfessionalReviewText({ review, rating });
    const uploadedImage = await uploadImageToLinkedinAsset({ accessToken, linkedinSub });

    const payload = {
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
            'com.linkedin.ugc.ShareContent': {
                shareCommentary: {
                    text,
                },
                shareMediaCategory: 'IMAGE',
                media: [
                    {
                        status: 'READY',
                        media: uploadedImage.asset,
                        title: {
                            text: 'Cardenas Labs - Home',
                        },
                        description: {
                            text: 'Resultados reales en desarrollo de software y producto digital.',
                        },
                    },
                ],
            },
        },
        visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
    };

    const response = await fetch(LINKEDIN_UGC_POSTS_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`LinkedIn publish error: ${errorText}`);
        error.status = response.status;
        throw error;
    }

    const postUrn = response.headers.get('x-restli-id') || '';
    return { postUrn, imageAsset: uploadedImage.asset, imageUrl: uploadedImage.imageUrl };
};

module.exports = { publishToLinkedin };
