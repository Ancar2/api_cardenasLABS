const notFound = (req, res, next) => {
    const error = new Error(`No encontrado - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        message = 'Recurso no encontrado';
        statusCode = 404;
    }

    if (err.code === 11000) {
        const duplicatedField = Object.keys(err.keyValue)[0];
        message = `El valor de "${duplicatedField}" ya existe`;
        statusCode = 400;
    }

    if (err.name === 'ValidationError') {
        message = Object.values(err.errors)
            .map((validationError) => validationError.message)
            .join(', ');
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};

module.exports = { notFound, errorHandler };
