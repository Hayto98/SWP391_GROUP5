const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const ApiError = require('../errors/ApiError')
const userRepository = require('../repositories/userRepository')
const { ROLES, USER_STATUS } = require('../utils/constants')

const DEFAULT_SALT_ROUNDS = 10

// ==================== HELPER: Map Role ID to Role Name ====================

function getRoleNameFromId(roleId) {
  const roleMap = {
    [ROLES.ADMIN]: 'ADMIN',
    [ROLES.CITIZEN]: 'CITIZEN',
    [ROLES.COLLECTOR]: 'COLLECTOR',
    [ROLES.ENTERPRISE]: 'ENTERPRISE'
  }
  return roleMap[roleId] || 'UNKNOWN'
}

// ==================== HELPER: Get Role ID from Role Name ====================

function getRoleIdFromName(roleName) {
  const roleMap = {
    ADMIN: ROLES.ADMIN,
    CITIZEN: ROLES.CITIZEN,
    COLLECTOR: ROLES.COLLECTOR,
    ENTERPRISE: ROLES.ENTERPRISE
  }
  return roleMap[roleName.toUpperCase()]
}

// ==================== HELPER: Format User Response ====================

function formatUserResponse(user) {
  return {
    userAccountId: user.userAccountId,
    fullname: user.fullname,
    email: user.email,
    phone: user.phone,
    role: getRoleNameFromId(user.roleId),
    isLocked: user.isLocked === 1 || user.isLocked === true,
    emailVerified: user.emailVerified === 1 || user.emailVerified === true,
    failedLoginCount: user.failedLoginCount || 0,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null
  }
}

// ==================== READ ====================

/**
 * TASK 1: Get all users with advanced filtering and pagination
 * GET /admin/users
 *
 * Query Params:
 * - role: ADMIN, ENTERPRISE, COLLECTOR, CITIZEN
 * - isLocked: true / false
 * - emailVerified: true / false
 * - keyword: search fullname / email
 * - page: pagination page
 * - limit: pagination limit
 * - createdAtFrom: ISO datetime string
 * - createdAtTo: ISO datetime string
 */
async function getAllUsers({ page = 1, limit = 20, role, isLocked, emailVerified, keyword, createdAtFrom, createdAtTo } = {}) {
  // Validate pagination params
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  // Build filters object
  const filters = {}

  // Filter by role
  if (role) {
    const roleId = getRoleIdFromName(role)
    if (!roleId) {
      throw new ApiError(400, 'Invalid role. Must be one of: ADMIN, ENTERPRISE, COLLECTOR, CITIZEN')
    }
    filters.roleId = roleId
  }

  // Filter by lock status
  if (isLocked !== undefined && isLocked !== null && isLocked !== '') {
    filters.isLocked = isLocked === 'true' || isLocked === true
  }

  // Filter by email verification
  if (emailVerified !== undefined && emailVerified !== null && emailVerified !== '') {
    filters.emailVerified = emailVerified === 'true' || emailVerified === true
  }

  // Filter by keyword
  if (keyword && keyword.trim()) {
    filters.keyword = keyword.trim()
  }

  // Filter by date range
  if (createdAtFrom) {
    filters.createdAtFrom = new Date(createdAtFrom)
  }
  if (createdAtTo) {
    filters.createdAtTo = new Date(createdAtTo)
  }

  // Fetch users with filters
  const users = await userRepository.findWithFilters(filters, limitNum, offset)
  const total = await userRepository.countWithFilters(filters)

  return {
    success: true,
    data: users.map(formatUserResponse),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total
    }
  }
}

/**
 * Get user by ID
 */
async function getUserById(userAccountId) {
  const user = await userRepository.findById(userAccountId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  return {
    success: true,
    data: formatUserResponse(user)
  }
}

// ==================== CREATE ====================

/**
 * TASK 2: Create a new user (Admin action)
 * POST /admin/users
 *
 * Request body:
 * {
 *   "fullname": "Tran Van B",
 *   "email": "b@gmail.com",
 *   "phone": "0912xxx",
 *   "password": "123456",
 *   "role": "COLLECTOR"
 * }
 *
 * Business Rules:
 * - Email must be unique
 * - Password is hashed
 * - Default: email_verified = true (admin creates)
 * - Default: is_locked = false
 * - Default: failed_login_count = 0
 */
async function createUser(data) {
<<<<<<< HEAD

  const { fullname, email, phone, password, role } = data

  // Validate required fields
  if (!fullname || !fullname.trim()) {
    throw new ApiError(400, 'fullname is required')
  }
  if (!email || !email.trim()) {
    throw new ApiError(400, 'email is required')
  }
  if (!password || !password.trim()) {
    throw new ApiError(400, 'password is required')
  }
  if (!role) {
    throw new ApiError(400, 'role is required')
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Invalid email format')
  }

  // Get role ID from role name
  const roleId = getRoleIdFromName(role)
  if (!roleId) {
    throw new ApiError(400, 'Invalid role. Must be one of: ADMIN, ENTERPRISE, COLLECTOR, CITIZEN')

=======
  const { fullname, email, phone, password, roleId } = data
  const normalizedRoleId = Number(roleId)

  // Validate required fields
  if (!fullname || !email || !phone || !password || !roleId) {
    throw new ApiError(400, 'fullname, email, phone, password and roleId are required')
  }

  // Validate role
  if (!Number.isInteger(normalizedRoleId) || !Object.values(ROLES).includes(normalizedRoleId)) {
    throw new ApiError(400, 'Invalid role specified')
>>>>>>> 545b70fc66f5c455157b9cc0f6534429a295248d
  }

  // Check email uniqueness
  const existingUser = await userRepository.findByEmail(email)
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered')
  }

  // Check phone uniqueness
  const existingUserByPhone = await userRepository.findByPhone(phone)
  if (existingUserByPhone) {
    throw new ApiError(409, 'Phone number is already registered')
  }

  const userAccountId = uuidv4()
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || DEFAULT_SALT_ROUNDS)
  const passwordHash = await bcrypt.hash(password, saltRounds)
  const createdAt = new Date()

<<<<<<< HEAD

  // Create user with proper defaults
  await userRepository.createUser({
    userAccountId,
    fullname: fullname.trim(),
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : null,
    passwordHash,
    roleId,
    createdAt
  })
=======
  try {
    await userRepository.createUser({
      userAccountId,
      fullname,
      email,
      phone,
      passwordHash,
      roleId: normalizedRoleId,
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
>>>>>>> 545b70fc66f5c455157b9cc0f6534429a295248d


  // Update email_verified and other defaults (if not already set by createUser)
  // This would require a migration or an extra update, but during creation we can assume defaults

  return {
<<<<<<< HEAD

    success: true,
    message: 'User created successfully',
    data: {
      userAccountId,
      fullname: fullname.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      role,
      isLocked: false,
      emailVerified: true,
      failedLoginCount: 0,
      createdAt
    }

=======
    userAccountId,
    fullname,
    email,
    phone,
    roleId: normalizedRoleId,
    createdAt
>>>>>>> 545b70fc66f5c455157b9cc0f6534429a295248d
  }
}

// ==================== UPDATE ====================

/**
<<<<<<< HEAD

 * TASK 3: Update user details (name, phone, role, lock status)
 * PUT /admin/users/:id
 *
 * Can update:
 * - fullname
 * - phone
 * - role
 * - isLocked
 *
 * Business Rules:
 * - Admin cannot change their own role
 * - Cannot demote the last ADMIN
 */
async function updateUser(targetUserId, data, adminId) {
  const { fullname, phone, role, isLocked } = data

  // Get target user
  const targetUser = await userRepository.findById(targetUserId)
  if (!targetUser) {
    throw new ApiError(404, 'User not found')
  }

  // Validate role change
  if (role) {
    // BR-A02: Admin cannot change their own role
    if (targetUserId === adminId) {
      throw new ApiError(403, 'You cannot change your own role')
    }

    const newRoleId = getRoleIdFromName(role)
    if (!newRoleId) {
      throw new ApiError(400, 'Invalid role. Must be one of: ADMIN, ENTERPRISE, COLLECTOR, CITIZEN')
    }

    // BR-A04: Cannot demote the last admin
    if (targetUser.roleId === ROLES.ADMIN && newRoleId !== ROLES.ADMIN) {

=======
 * Update user details (fullname, phone, roleId, isLocked, banReason)
 */
async function updateUser(userAccountId, data, adminId) {
  const user = await userRepository.findById(userAccountId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  const { fullname, phone, roleId, isLocked, banReason } = data

  // Validate roleId if provided
  if (roleId !== undefined) {
    if (!Object.values(ROLES).includes(roleId)) {
      throw new ApiError(400, 'Invalid role specified')
    }
    if (adminId && userAccountId === adminId) {
      throw new ApiError(403, 'You cannot change your own role')
    }
    if (user.roleId === ROLES.ADMIN && roleId !== ROLES.ADMIN) {
>>>>>>> 545b70fc66f5c455157b9cc0f6534429a295248d
      const adminCount = await userRepository.countByRole(ROLES.ADMIN)
      if (adminCount <= 1) {
        throw new ApiError(409, 'Cannot demote the last administrator')
      }
    }
<<<<<<< HEAD


    await userRepository.updateRole(targetUserId, newRoleId)
  }

  // Update basic info
  const updateData = {}
  if (fullname !== undefined) {
    if (!fullname.trim()) {
      throw new ApiError(400, 'fullname cannot be empty')
    }
    updateData.fullname = fullname.trim()
  }
  if (phone !== undefined) {
    if (phone && !/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
      throw new ApiError(400, 'Invalid phone number')
    }
    updateData.phone = phone ? phone.trim() : null
  }

  if (Object.keys(updateData).length > 0) {
    await userRepository.update(targetUserId, updateData)
  }

  // Update lock status
  if (isLocked !== undefined) {
    // BR-A03: Admin cannot lock their own account
    if (targetUserId === adminId && isLocked === true) {
      throw new ApiError(403, 'You cannot lock your own account')
    }

    // BR-A04: Cannot lock the last admin
    if (isLocked && targetUser.roleId === ROLES.ADMIN) {
      const adminCount = await userRepository.countByRole(ROLES.ADMIN)
      if (adminCount <= 1) {
        throw new ApiError(409, 'Cannot lock the last administrator')
      }
    }

    await userRepository.updateLockStatus(targetUserId, isLocked)
  }

  // Return updated user
  const updatedUser = await userRepository.findById(targetUserId)
  return {
    success: true,
    message: 'User updated successfully',
    data: formatUserResponse(updatedUser)
  }

=======
  }

  // Validate isLocked if provided
  if (isLocked !== undefined && isLocked && adminId && userAccountId === adminId) {
    throw new ApiError(403, 'You cannot lock your own account')
  }
  if (isLocked !== undefined && isLocked && user.roleId === ROLES.ADMIN) {
    const adminCount = await userRepository.countByRole(ROLES.ADMIN)
    if (adminCount <= 1) {
      throw new ApiError(409, 'Cannot lock the last administrator')
    }
  }

  const safeData = {}
  if (fullname !== undefined) safeData.fullname = fullname
  if (phone !== undefined) safeData.phone = phone
  if (roleId !== undefined) safeData.roleId = roleId
  if (isLocked !== undefined) safeData.isLocked = isLocked
  if (banReason !== undefined) safeData.banReason = banReason

  if (Object.keys(safeData).length === 0) return user

  await userRepository.update(userAccountId, safeData)
  return await userRepository.findById(userAccountId)
>>>>>>> 545b70fc66f5c455157b9cc0f6534429a295248d
}

/**
 * Deprecated: Use updateUser instead for role changes
 */
async function changeUserRole(targetUserId, newRole, adminId) {
  return updateUser(targetUserId, { role: newRole }, adminId)
}

/**
 * Deprecated: Use updateUser instead for status changes
 */
async function changeUserStatus(targetUserId, isLockedValue, adminId) {
  return updateUser(targetUserId, { isLocked: isLockedValue }, adminId)
}

// ==================== DELETE ====================

/**
 * TASK 4: Soft delete user
 * DELETE /admin/users/:id
 *
 * Business Rules:
 * - BR-A01: Admin cannot delete their own account
 * - BR-A04: Cannot delete the last admin
 * - Uses soft delete by setting `ban_reason = 'Account deactivated'` and locking the account
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

  return {
    success: true,
    message: 'User deleted successfully'
  }
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
