const ApiError = require("../util/api_error");

/**
 * Restricts a route to the given roles.
 * Usage: requireRole("admin") or requireRole("reception", "admin")
 * Must run after requireAuth.
 */
function requireRole(...allowedRoles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}

module.exports = { requireRole };