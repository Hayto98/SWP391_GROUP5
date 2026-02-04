const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const ApiError = require('../errors/ApiError')
const userRepository = require('../repositories/userRepository')
const { ROLES, USER_STATUS } = require('../utils/constants')

const DEFAULT_SALT_ROUNDS = 10

// ==================== READ ====================

/**
 * Get all users with pagination
 */
async function getAllUsers({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const users = await userRepository.findAll({ limit, offset })
  const total = await userRepository.countAll()
  return { users, total, page, limit }
}

/**
 * Get user by ID
 */
async function getUserById(userAccountId) {
  const user = await userRepository.findById(userAccountId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  return user
}

// ==================== CREATE ====================

/**
 * Create a new user (Admin action)
 */
async function createUser(data) {
  const { fullname, email, phone, password, roleId } = data

  // Validate required fields
  if (!fullname || !email || !password || !roleId) {
    throw new ApiError(400, 'fullname, email, password and roleId are required')
  }

  // Validate role
  if (!Object.values(ROLES).includes(roleId)) {
    throw new ApiError(400, 'Invalid role specified')
  }

  // Check email uniqueness
  const existingUser = await userRepository.findByEmail(email)
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered')
  }

  const userAccountId = uuidv4()
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || DEFAULT_SALT_ROUNDS)
  const passwordHash = await bcrypt.hash(password, saltRounds)
  const createdAt = new Date()

  await userRepository.createUser({
    userAccountId,
    fullname,
    email,
    phone: phone || null,
    passwordHash,
    roleId,
    createdAt
  })

  return {
    userAccountId,
    fullname,
    email,
    phone,
    roleId,
    createdAt
  }
}

// ==================== UPDATE ====================

/**
 * Update user details (name, phone only - not role/status)
 */
async function updateUser(userAccountId, data) {
  const user = await userRepository.findById(userAccountId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // Only allow updating safe fields
  const safeData = {
    fullname: data.fullname,
    phone: data.phone
  }

  await userRepository.update(userAccountId, safeData)
  return await userRepository.findById(userAccountId)
}

/**
 * Change user role
 * Business Rules:
 *   - BR-A02: Admin cannot change their own role
 *   - BR-A04: Cannot demote the last admin
 */
async function changeUserRole(targetUserId, newRoleId, adminId) {
  // BR-A02: Admin cannot change their own role
  if (targetUserId === adminId) {
    throw new ApiError(403, 'You cannot change your own role')
  }

  // Validate role
  if (!Object.values(ROLES).includes(newRoleId)) {
    throw new ApiError(400, 'Invalid role specified')
  }

  const user = await userRepository.findById(targetUserId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // BR-A04: Cannot demote the last admin
  if (user.roleId === ROLES.ADMIN && newRoleId !== ROLES.ADMIN) {
    const adminCount = await userRepository.countByRole(ROLES.ADMIN)
    if (adminCount <= 1) {
      throw new ApiError(409, 'Cannot demote the last administrator')
    }
  }

  await userRepository.updateRole(targetUserId, newRoleId)
  return await userRepository.findById(targetUserId)
}

/**
 * Change user status (Lock/Unlock)
 * Business Rules:
 *   - BR-A03: Admin cannot lock their own account
 *   - BR-A04: Cannot lock the last admin
 */
async function changeUserStatus(targetUserId, status, adminId) {
  // BR-A03: Admin cannot lock their own account
  if (targetUserId === adminId) {
    throw new ApiError(403, 'You cannot lock your own account')
  }

  // Validate status
  if (!Object.values(USER_STATUS).includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be ACTIVE or LOCKED')
  }

  const user = await userRepository.findById(targetUserId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  const isLocking = status === USER_STATUS.LOCKED

  // BR-A04: Cannot lock the last admin
  if (isLocking && user.roleId === ROLES.ADMIN) {
    const adminCount = await userRepository.countByRole(ROLES.ADMIN)
    if (adminCount <= 1) {
      throw new ApiError(409, 'Cannot lock the last administrator')
    }
  }

  await userRepository.updateLockStatus(targetUserId, isLocking)
  return await userRepository.findById(targetUserId)
}

// ==================== DELETE ====================

/**
 * Soft delete user
 * Business Rules:
 *   - BR-A01: Admin cannot delete their own account
 *   - BR-A04: Cannot delete the last admin
 */
async function deleteUser(targetUserId, adminId) {
  // BR-A01: Admin cannot delete their own account
  if (targetUserId === adminId) {
    throw new ApiError(403, 'You cannot delete your own account')
  }

  const user = await userRepository.findById(targetUserId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // BR-A04: Cannot delete the last admin
  if (user.roleId === ROLES.ADMIN) {
    const adminCount = await userRepository.countByRole(ROLES.ADMIN)
    if (adminCount <= 1) {
      throw new ApiError(409, 'Cannot delete the last administrator')
    }
  }

  await userRepository.softDeleteUser(targetUserId)
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserRole,
  changeUserStatus,
  deleteUser
}
