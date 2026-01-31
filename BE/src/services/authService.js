const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const ApiError = require('../errors/ApiError')
const userRepository = require('../repositories/userRepository')
const refreshTokenRepository = require('../repositories/refreshTokenRepository')
const tokenService = require('./tokenService')

const DEFAULT_SALT_ROUNDS = 10

async function register({ fullname, email, phone, password, roleId }) {
  if (!fullname || !email || !password || !roleId) {
    throw new ApiError(400, 'fullname, email, password and roleId are required')
  }

  const existingUser = await userRepository.findByEmail(email)
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered')
  }

  const userAccountId = uuidv4()
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || DEFAULT_SALT_ROUNDS)
  const passwordHash = await bcrypt.hash(password, saltRounds)
  const createdAt = new Date()

  try {
    await userRepository.createUser({
      userAccountId,
      fullname,
      email,
      phone,
      passwordHash,
      roleId,
      createdAt
    })
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApiError(400, 'Provided roleId does not exist')
    }

    if (error.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'Email or phone number already exists')
    }

    throw error
  }

  return {
    userAccountId,
    fullname,
    email,
    phone,
    roleId,
    createdAt
  }
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required')
  }

  const user = await userRepository.findByEmail(email)

  if (!user) {
    throw new ApiError(401, 'Invalid credentials')
  }

  if (user.isDisabled) {
    throw new ApiError(403, 'Account is disabled')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Account is locked')
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const refreshTokenId = uuidv4()
  const refreshTokenPayload = { sub: user.userAccountId, type: 'refresh' }
  const accessTokenPayload = {
    sub: user.userAccountId,
    email: user.email,
    roleId: user.roleId
  }

  const accessToken = tokenService.generateAccessToken(accessTokenPayload)
  const refreshToken = tokenService.generateRefreshToken(refreshTokenPayload, refreshTokenId)
  const tokenHash = tokenService.hashToken(refreshToken)
  const refreshTokenExpiresAt = tokenService.calculateExpiryDate(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d')

  await refreshTokenRepository.removeByUserId(user.userAccountId)
  await refreshTokenRepository.saveRefreshToken({
    refreshTokenId,
    userAccountId: user.userAccountId,
    tokenHash,
    expiresAt: refreshTokenExpiresAt,
    createdAt: new Date()
  })

  return {
    user: {
      userAccountId: user.userAccountId,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    }
  }
}

module.exports = {
  register,
  login
}
