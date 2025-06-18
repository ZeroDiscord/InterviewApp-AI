const config = require('../config');

// Custom Error class
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('--- UNHANDLED ERROR ---');
    console.error(err);

    res.status(err.statusCode).json({
        status: err.status,
        title: err.name,
        message: err.message,
        stack: config.nodeEnv === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler, AppError };