const tokenService = require('../services/tokenService')
const ApiError = require('../errors/ApiError')
const userRepository = require('../repositories/userRepository')

/**
 * Middleware: Verify JWT Access Token
 * Extracts token from Authorization header, verifies it, and attaches user info to req.user.
 * Also checks that the account is not locked/deleted so deleted users are kicked out immediately.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next(new ApiError(401, 'Access token is required'))
  }

  let decoded
  try {
    decoded = tokenService.verifyAccessToken(token)
  } catch {
    return next(new ApiError(403, 'Invalid or expired token'))
  }

  // Check account still active in DB (catches deleted / locked users still holding a valid JWT)
  const user = await userRepository.findById(decoded.sub)
  if (!user || user.isLocked) {
    return next(new ApiError(401, 'Account has been deactivated. Please log in again.'))
  }

  req.user = decoded
  next()
}

module.exports = { verifyToken }
