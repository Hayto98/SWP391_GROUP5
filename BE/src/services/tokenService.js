const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const ApiError = require('../errors/ApiError')

function ensureSecret(secret, label) {
  if (!secret) {
    throw new ApiError(500, `${label} is not configured`)
  }

  return secret
}

function parseDuration(duration, fallbackMs) {
  if (!duration) {
    return fallbackMs
  }

  const numeric = Number(duration)
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric
  }

  const match = duration.match(/^(\d+)([smhd])$/)
  if (!match) {
    return fallbackMs
  }

  const value = Number(match[1])
  const unit = match[2]

  switch (unit) {
    case 's':
      return value * 1000
    case 'm':
      return value * 1000 * 60
    case 'h':
      return value * 1000 * 60 * 60
    case 'd':
      return value * 1000 * 60 * 60 * 24
    default:
      return fallbackMs
  }
}

function calculateExpiryDate(duration) {
  const ttl = parseDuration(duration, 0)
  if (ttl <= 0) {
    return null
  }

  return new Date(Date.now() + ttl)
}

function generateAccessToken(payload) {
  const secret = ensureSecret(process.env.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET')
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'

  return jwt.sign(payload, secret, { expiresIn })
}

function generateRefreshToken(payload, jwtId) {
  const secret = ensureSecret(process.env.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET')
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

  return jwt.sign(payload, secret, { expiresIn, jwtid: jwtId })
}

function verifyAccessToken(token) {
  const secret = ensureSecret(process.env.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET')
  return jwt.verify(token, secret)
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  hashToken,
  calculateExpiryDate,
  verifyAccessToken
}
