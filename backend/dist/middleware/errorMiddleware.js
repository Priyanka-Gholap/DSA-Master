"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`[Error] ${req.method} ${req.path} - Status: ${statusCode} - Message: ${message}`);
    if (err.stack && process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
