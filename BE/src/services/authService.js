const bcrypt = require('bcryptjs')
const ApiError = require('../errors/ApiError')
const userRepository = require('../repositories/userRepository')
const tokenService = require('./tokenService')

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

  return {
    userAccountId,
    fullname,
    email,
    phone,
    roleId,
    createdAt
  }
}

async function login({ phone, password }) {
  if (!phone || !password) {
    throw new ApiError(400, 'phone and password are required')
  }

  const user = await userRepository.findByPhone(phone)

  if (!user) {
    throw new ApiError(401, 'Invalid credentials')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Account is locked')
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const accessTokenPayload = {
    sub: user.userAccountId,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId
  }

  const accessToken = tokenService.generateAccessToken(accessTokenPayload)

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
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
    }
  }
}

async function logout() {
  // Chỉ access token được client xóa khi logout
}

module.exports = {
  register,
  login,
  logout
}
