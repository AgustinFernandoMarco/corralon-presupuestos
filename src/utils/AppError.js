// Error "esperado" con código HTTP (validaciones, datos inválidos, etc.)
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = AppError;
