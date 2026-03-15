const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const ApiError = require('../errors/ApiError')
const userRepository = require('../repositories/userRepository')
const refreshTokenRepository = require('../repositories/refreshTokenRepository')
const otpRepository = require('../repositories/otpRepository')
const tokenService = require('./tokenService')
const emailService = require('./emailService')

const DEFAULT_SALT_ROUNDS = 10

async function register({ fullname, email, phone, password, roleId }) {
  if (!fullname || !email || !password || !roleId || !phone) {
    throw new ApiError(400, 'fullname, email, phone, password and roleId are required')
  }

  const existingUserByEmail = await userRepository.findByEmail(email)
  if (existingUserByEmail) {
    throw new ApiError(409, 'Email is already registered')
  }

  const existingUserByPhone = await userRepository.findByPhone(phone)
  if (existingUserByPhone) {
    throw new ApiError(409, 'Phone number is already registered')
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

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const otpExpiresMinutes = Number(process.env.OTP_EXPIRES_MINUTES || 5)
  const expiredAt = new Date(Date.now() + otpExpiresMinutes * 60 * 1000)

  await otpRepository.saveOtp(userAccountId, otp, expiredAt)
  await emailService.sendOtpEmail(email, otp)

  return {
    requireOtp: true,
    message: 'OTP has been sent to your email. Please verify to continue.',
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

  if (user.isLocked) {
    throw new ApiError(403, `Account is locked. Reason: ${user.banReason || 'Not specified'}`)
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    const newFailedCount = (user.failedLoginCount || 0) + 1
    if (newFailedCount >= 5) {
      await userRepository.updateLockStatus(user.userAccountId, true)
    } else {
      await userRepository.updateFailedLoginCount(user.userAccountId, newFailedCount)
    }
    throw new ApiError(401, 'Invalid credentials')
  }

  if (!user.emailVerified) {
    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpExpiresMinutes = Number(process.env.OTP_EXPIRES_MINUTES || 5)
    const expiredAt = new Date(Date.now() + otpExpiresMinutes * 60 * 1000)

    await otpRepository.saveOtp(user.userAccountId, otp, expiredAt)
    await emailService.sendOtpEmail(user.email, otp)

    return {
      requireOtp: true,
      email: user.email,
      message: 'OTP has been sent to your email. Please verify to continue.'
    }
  }

  // If email is already verified, bypass OTP and log in instantly
  // Update last login and reset failed login count
  await userRepository.updateLastLogin(user.userAccountId)

  const accessTokenPayload = {
    sub: user.userAccountId,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId
  }

  const refreshTokenId = uuidv4()
  const refreshTokenPayload = { sub: user.userAccountId, type: 'refresh' }

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
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
    }
  }
}

async function verifyOtp({ email, otp }) {
  if (!email || !otp) {
    throw new ApiError(400, 'email and otp are required')
  }

  const user = await userRepository.findByEmail(email)
  if (!user) {
    throw new ApiError(401, 'Invalid or expired OTP')
  }

  if (user.isLocked) {
    throw new ApiError(403, `Account is locked. Reason: ${user.banReason || 'Not specified'}`)
  }

  const validOtp = await otpRepository.findValidOtp(user.userAccountId, otp)
  if (!validOtp) {
    throw new ApiError(401, 'Invalid or expired OTP')
  }

  // Mark OTP as used
  await otpRepository.markOtpUsed(validOtp.verificationTokenId)

  if (!user.emailVerified) {
    await userRepository.verifyEmail(user.userAccountId)
  }

  // Update last login and reset failed login count
  await userRepository.updateLastLogin(user.userAccountId)

  const accessTokenPayload = {
    sub: user.userAccountId,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId
  }

  const refreshTokenId = uuidv4()
  const refreshTokenPayload = { sub: user.userAccountId, type: 'refresh' }

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
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
    }
  }
}

async function logout() {
  // Access token được client xóa khi logout
}

module.exports = {
  register,
  login,
  verifyOtp,
  logout
}
