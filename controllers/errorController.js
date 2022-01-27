const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  // const value = err.keyValue.name;
  console.log(value);
  const message = `Duplicate fields value: ${value}. Please use different name`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // Creating an array of values and then looping over it
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () => {
  new AppError('Your token has expired. Please log in again', 401);
};

const sendErrorDev = (err, req, res) => {
  // a) API
  // if url starts with /api then we send error as JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // b) RENDERED WEBSITE
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    // A) OPERATIONAL, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      //
    }
    // B) Programming or other UNKNOWN error: don't leak error details
    // 1) Log error
    // Just logging the error will make it seen in console (of hosting platforms that you're using-?)
    console.error('ERROR!', err);

    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later',
    });
  }
  // b) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  } else {
    // 1) Log error
    // Just logging the error will make it seen in the console
    console.error('ERROR!', err);

    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later',
    });
  }
};

module.exports = (err, req, res, next) => {
  // 500 - a standard. Internal server error. So here - if statusCode eexists - statusCode. Otherwise 500
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Craeting a hardcopy of err
    let error = Object.assign(err);
    // console.log(error);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
