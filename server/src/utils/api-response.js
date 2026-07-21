class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const sendSuccess = (res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'Erro interno do servidor', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    details,
  });
};

module.exports = {
  AppError,
  sendSuccess,
  sendError,
};
