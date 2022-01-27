class AppError extends Error {
  // Remember! constructor() called each time we create a new object out of this class
  constructor(message, statusCode) {
    // We want to extend parent class - we call super. Message is the only parameter the buil-in error accepts
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Need it to test for operational property later
    this.isOperational = true;

    // Need to specify the current object and THEN the class itself
    // So now when a new obj is created and a constructor is called, then it won't appear in the stack trace - less pollution
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
