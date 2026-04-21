const dotenv = require('dotenv');
const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

const applySecretValues = (secretString) => {
    const parsedSecret = JSON.parse(secretString);

    Object.entries(parsedSecret).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            process.env[key] = String(value);
        }
    });
};

const loadAwsSecrets = async () => {
    const secretId = process.env.AWS_SECRETS_MANAGER_SECRET_ID;

    if (!secretId) {
        throw new Error(
            'Falta AWS_SECRETS_MANAGER_SECRET_ID para cargar variables desde AWS Secrets Manager'
        );
    }

    const client = new SecretsManagerClient({
        region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
    });

    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await client.send(command);

    if (!response.SecretString) {
        throw new Error('AWS Secrets Manager no devolvio un SecretString valido');
    }

    applySecretValues(response.SecretString);
};

const loadEnv = async () => {
    dotenv.config();

    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    await loadAwsSecrets();
};

module.exports = loadEnv;
