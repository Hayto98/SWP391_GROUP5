const ApiError = require('../errors/ApiError')

/**
 * Middleware: Require specific roles to access route
 * @param  {...number} allowedRoles - List of allowed role IDs (e.g., ROLES.ADMIN)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Check if user object exists (should be set by verifyToken)
    if (!req.user || req.user.roleId === undefined) {
      return next(new ApiError(403, 'User identity not verified'))
    }

    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(req.user.roleId)) {
      return next(new ApiError(403, 'Access denied: insufficient permissions'))
    }

    next()
  }
}

module.exports = { requireRole }
