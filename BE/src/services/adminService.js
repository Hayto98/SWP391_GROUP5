const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const ApiError = require('../errors/ApiError')
const userRepository = require('../repositories/userRepository')
const { ROLES, USER_STATUS } = require('../utils/constants')

const DEFAULT_SALT_ROUNDS = 10

// ==================== DASHBOARD ====================
async function getDashboardStats() {
  const db = require('../config/database')
  const [usersRes] = await db.execute(`
    SELECT COUNT(*) as total 
    FROM useraccount 
    WHERE ban_reason IS NULL OR ban_reason != 'Account deactivated'
  `)
  const totalUsers = Number(usersRes[0].total) || 0

  const [complaintsRes] = await db.execute(`
    SELECT COUNT(*) as total 
    FROM reportcomplaint 
    WHERE is_deleted = 0
  `)
  const totalComplaints = Number(complaintsRes[0].total) || 0

  const [resolvedRes] = await db.execute(`
    SELECT COUNT(*) as total 
    FROM reportcomplaint 
    WHERE complaint_status IN ('RESOLVED', 'REJECTED') 
      AND is_deleted = 0
  `)
  const resolvedComplaints = Number(resolvedRes[0].total) || 0

  const [complaintsByTimeRes] = await db.execute(`
    SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as time, COUNT(*) as complaints
    FROM reportcomplaint
    WHERE is_deleted = 0
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY time ASC
    LIMIT 30
  `)

  const complaintsByTime = complaintsByTimeRes.map((row) => ({
    time: row.time,
    complaints: Number(row.complaints)
  }))

  const [resolvedComplaintsByTimeRes] = await db.execute(`
    SELECT DATE_FORMAT(resolved_at, '%Y-%m-%d') as time, COUNT(*) as resolved
    FROM reportcomplaint
    WHERE complaint_status IN ('RESOLVED', 'REJECTED') 
      AND is_deleted = 0 
      AND resolved_at IS NOT NULL
    GROUP BY DATE_FORMAT(resolved_at, '%Y-%m-%d')
    ORDER BY time ASC
    LIMIT 30
  `)

  const resolvedComplaintsByTime = resolvedComplaintsByTimeRes.map((row) => ({
    time: row.time,
    resolved: Number(row.resolved)
  }))

  return {
    totalUsers,
    totalComplaints,
    resolvedComplaints,
    complaintsByTime,
    resolvedComplaintsByTime
  }
}

// ==================== READ ====================
/**
 * Get all users with pagination, keyword search, and role filter
 */
async function getAllUsers({ page = 1, limit = 20, keyword, role } = {}) {
  const offset = (page - 1) * limit
  const roleId = role !== undefined && role !== '' ? Number(role) : undefined
  const filter = { keyword: keyword?.trim() || undefined, roleId }
  const users = await userRepository.findAll({ limit, offset, ...filter })
  const stats = await userRepository.getUserStats(filter)
  return { users, ...stats, page, limit }
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
  const normalizedRoleId = Number(roleId)

  // Validate required fields
  if (!fullname || !email || !phone || !password || !roleId) {
    throw new ApiError(400, 'fullname, email, phone, password and roleId are required')
  }

  // Validate role
  if (!Number.isInteger(normalizedRoleId) || !Object.values(ROLES).includes(normalizedRoleId)) {
    throw new ApiError(400, 'Invalid role specified')
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

  return {
    userAccountId,
    fullname,
    email,
    phone,
    roleId: normalizedRoleId,
    createdAt
  }
}

// ==================== UPDATE ====================

/**
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
      const adminCount = await userRepository.countByRole(ROLES.ADMIN)
      if (adminCount <= 1) {
        throw new ApiError(409, 'Cannot demote the last administrator')
      }
    }
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

// ==================== ENTERPRISE ====================

/**
 * Create a new Enterprise user (Admin action)
 * roleId is fixed to ROLES.ENTERPRISE
 */
async function createEnterprise(data) {
  const { fullname, email, phone, password } = data

  if (!fullname || !email || !phone || !password) {
    throw new ApiError(400, 'fullname, email, phone and password are required')
  }

  const existingUser = await userRepository.findByEmail(email)
  if (existingUser) {
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
      roleId: ROLES.ENTERPRISE,
      createdAt
    })
  } catch (error) {
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
    roleId: ROLES.ENTERPRISE,
    createdAt
  }
}

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  createUser,
  createEnterprise,
  updateUser,
  changeUserRole,
  changeUserStatus,
  deleteUser
}
