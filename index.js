const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const loadEnv = require('./config/loadEnv');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const router = require('./routes/routes');

const startServer = async () => {
    await loadEnv();
    await connectDB();

    const app = express();
    app.disable('x-powered-by');

    const corsOrigins = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const isProduction = process.env.NODE_ENV === 'production';
    const jsonLimit = process.env.API_JSON_LIMIT || '10mb';
    const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
    const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 100);

    const limiter = rateLimit({
        windowMs: rateLimitWindowMs,
        limit: rateLimitMax,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Demasiadas solicitudes, intenta nuevamente en unos minutos',
        },
    });

    if (process.env.TRUST_PROXY === 'true') {
        app.set('trust proxy', 1);
    }

    app.use(
        cors({
            origin: corsOrigins.length > 0 ? corsOrigins : !isProduction,
            credentials: process.env.CORS_CREDENTIALS !== 'false',
        })
    );
    app.use(helmet());
    app.use(compression());
    app.use(limiter);
    app.use(express.json({ limit: jsonLimit }));
    app.use(cookieParser());

    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    }

    app.get('/api/health', (req, res) => {
        res.status(200).json({
            success: true,
            data: {
                status: 'ok',
                timestamp: new Date().toISOString(),
            },
        });
    });

    app.use('/api', router);
    app.use(notFound);
    app.use(errorHandler);

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(
            `Servidor corriendo en modo ${
                process.env.NODE_ENV || 'development'
            } en el puerto ${PORT}`
        );
    });
};

startServer().catch((error) => {
    console.error(`Error al iniciar el servidor: ${error.message}`);
    process.exit(1);
});
