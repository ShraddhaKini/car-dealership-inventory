const { AuthenticationError, ForbiddenError } = require('../errors');

/**
 * Builds the authentication and authorisation middleware around an AuthService.
 * `authenticate` populates req.user; `requireAdmin` must run after it.
 */
function createAuthMiddleware(authService) {
  const authenticate = (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new AuthenticationError('Authentication token missing'));
    }
    try {
      req.user = authService.verifyToken(token);
      return next();
    } catch (error) {
      return next(error);
    }
  };

  const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
      return next(new ForbiddenError('Admin access required'));
    }
    return next();
  };

  return { authenticate, requireAdmin };
}

module.exports = createAuthMiddleware;
