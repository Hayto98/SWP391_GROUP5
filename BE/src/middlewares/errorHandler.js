const ApiError = require('../errors/ApiError')

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const status = err instanceof ApiError && err.status ? err.status : 500
  const payload = {
    message: err.message || 'Internal server error'
  }

  if (err.details) {
    payload.details = err.details
  }

  if (process.env.NODE_ENV === 'development') {
    payload.trace = err.stack
  }

  res.status(status).json(payload)
}

module.exports = errorHandler
