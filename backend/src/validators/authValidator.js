const { ValidationError } = require('../errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/** Validates registration/login credentials and returns them normalised. */
function validateCredentials(payload, { enforcePasswordRules = false } = {}) {
  if (payload === null || typeof payload !== 'object') {
    throw new ValidationError('Request body must be a JSON object');
  }

  const { email, password } = payload;
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    throw new ValidationError('A valid email address is required');
  }
  if (typeof password !== 'string' || password.length === 0) {
    throw new ValidationError('Password is required');
  }
  if (enforcePasswordRules && password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  return { email: email.trim().toLowerCase(), password };
}

module.exports = { validateCredentials };
