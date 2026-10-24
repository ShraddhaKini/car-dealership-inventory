/** Base class for errors that map directly to an HTTP response. */
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(400, message);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(409, message);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
