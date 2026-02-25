const tokenService = require('../services/tokenService')
const ApiError = require('../errors/ApiError')

/**
 * Middleware: Verify JWT Access Token
 * Extracts token from Authorization header, verifies it, and attaches user info to req.user
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next(new ApiError(401, 'Access token is required'))
  }

  try {
    const decoded = tokenService.verifyAccessToken(token)
    req.user = decoded // Attach decoded payload (sub, roleId, email, etc.)
    next()
  } catch {
    return next(new ApiError(403, 'Invalid or expired token'))
  }
}

module.exports = { verifyToken }
