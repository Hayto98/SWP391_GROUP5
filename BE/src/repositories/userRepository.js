const db = require('../config/database')

// ==================== READ ====================

async function findByEmail(email) {
  const [rows] = await db.execute(
    `SELECT user_account_id AS userAccountId,
            fullname,
            email,
            phone,
            password_hash AS passwordHash,
            role_id AS roleId,
            collector_reject_count AS collectorRejectCount,
            is_locked AS isLocked,
            email_verified AS emailVerified,
            failed_login_count AS failedLoginCount,

            last_login_at AS lastLoginAt,
            ban_reason AS banReason,
            created_at AS createdAt
       FROM UserAccount
      WHERE email = ?
      LIMIT 1`,
    [email]
  )
  return rows[0] || null
}

async function findByPhone(phone) {
  const [rows] = await db.execute(
    `SELECT user_account_id AS userAccountId,
            fullname,
            email,
            phone,
            password_hash AS passwordHash,
            role_id AS roleId,
            collector_reject_count AS collectorRejectCount,
            is_locked AS isLocked,
            email_verified AS emailVerified,
            failed_login_count AS failedLoginCount,

            last_login_at AS lastLoginAt,
            ban_reason AS banReason,
            created_at AS createdAt
       FROM UserAccount
      WHERE phone = ?
      LIMIT 1`,
    [phone]
  )
  return rows[0] || null
}

const SOFT_DELETED_REASON = 'Account deactivated'

async function findById(userAccountId) {
  const [rows] = await db.execute(
    `SELECT user_account_id AS userAccountId,
            fullname,
            email,
            phone,
            role_id AS roleId,
            collector_reject_count AS collectorRejectCount,
            is_locked AS isLocked,
            email_verified AS emailVerified,
            failed_login_count AS failedLoginCount,

            last_login_at AS lastLoginAt,
            ban_reason AS banReason,
            created_at AS createdAt
       FROM UserAccount
      WHERE user_account_id = ?
        AND (ban_reason IS NULL OR ban_reason != ?)
      LIMIT 1`,
    [userAccountId, SOFT_DELETED_REASON]
  )
  return rows[0] || null
}

async function findAll({ limit = 20, offset = 0 } = {}) {
  const [rows] = await db.execute(
    `SELECT user_account_id AS userAccountId,
            fullname,
            email,
            phone,
            role_id AS roleId,
            collector_reject_count AS collectorRejectCount,
            is_locked AS isLocked,
            email_verified AS emailVerified,
            failed_login_count AS failedLoginCount,

            last_login_at AS lastLoginAt,
            ban_reason AS banReason,
            created_at AS createdAt
       FROM UserAccount
      WHERE (ban_reason IS NULL OR ban_reason != ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    [SOFT_DELETED_REASON, String(limit), String(offset)]
  )
  return rows
}

async function countAll() {
  const [rows] = await db.execute(
    'SELECT COUNT(*) as total FROM UserAccount WHERE (ban_reason IS NULL OR ban_reason != ?)',
    [SOFT_DELETED_REASON]
  )
  return rows[0].total
}

/**
 * Find users with advanced filtering
 * @param {Object} filters - Filter criteria
 * @param {number} filters.roleId - Filter by role_id
 * @param {boolean} filters.isLocked - Filter by lock status
 * @param {boolean} filters.emailVerified - Filter by email verification status
 * @param {string} filters.keyword - Search in fullname or email
 * @param {number} limit - Pagination limit
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} Filtered users
 */
async function findWithFilters(filters = {}, limit = 20, offset = 0) {
  let whereConditions = ['(ban_reason IS NULL OR ban_reason != ?)']
  const params = [SOFT_DELETED_REASON]

  // Filter by role
  if (filters.roleId !== undefined && filters.roleId !== null) {
    whereConditions.push('role_id = ?')
    params.push(filters.roleId)
  }

  // Filter by lock status
  if (filters.isLocked !== undefined && filters.isLocked !== null) {
    whereConditions.push('is_locked = ?')
    params.push(filters.isLocked ? 1 : 0)
  }

  // Filter by email verification status
  if (filters.emailVerified !== undefined && filters.emailVerified !== null) {
    whereConditions.push('email_verified = ?')
    params.push(filters.emailVerified ? 1 : 0)
  }

  // Search by keyword in fullname or email
  if (filters.keyword) {
    whereConditions.push('(fullname LIKE ? OR email LIKE ?)')
    const searchTerm = `%${filters.keyword}%`
    params.push(searchTerm, searchTerm)
  }

  // Filter by date range if provided
  if (filters.createdAtFrom) {
    whereConditions.push('created_at >= ?')
    params.push(filters.createdAtFrom)
  }
  if (filters.createdAtTo) {
    whereConditions.push('created_at <= ?')
    params.push(filters.createdAtTo)
  }

  params.push(String(limit), String(offset))

  const whereClause = whereConditions.join(' AND ')
  const [rows] = await db.execute(
    `SELECT user_account_id AS userAccountId,
            fullname,
            email,
            phone,
            role_id AS roleId,
            is_locked AS isLocked,
            email_verified AS emailVerified,
            failed_login_count AS failedLoginCount,
            created_at AS createdAt,
            last_login_at AS lastLoginAt
       FROM UserAccount
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    params
  )
  return rows
}

/**
 * Count users with advanced filtering
 * @param {Object} filters - Same filter criteria as findWithFilters
 * @returns {Promise<number>} Total count matching filters
 */
async function countWithFilters(filters = {}) {
  let whereConditions = ['(ban_reason IS NULL OR ban_reason != ?)']
  const params = [SOFT_DELETED_REASON]

  if (filters.roleId !== undefined && filters.roleId !== null) {
    whereConditions.push('role_id = ?')
    params.push(filters.roleId)
  }

  if (filters.isLocked !== undefined && filters.isLocked !== null) {
    whereConditions.push('is_locked = ?')
    params.push(filters.isLocked ? 1 : 0)
  }

  if (filters.emailVerified !== undefined && filters.emailVerified !== null) {
    whereConditions.push('email_verified = ?')
    params.push(filters.emailVerified ? 1 : 0)
  }

  if (filters.keyword) {
    whereConditions.push('(fullname LIKE ? OR email LIKE ?)')
    const searchTerm = `%${filters.keyword}%`
    params.push(searchTerm, searchTerm)
  }

  if (filters.createdAtFrom) {
    whereConditions.push('created_at >= ?')
    params.push(filters.createdAtFrom)
  }
  if (filters.createdAtTo) {
    whereConditions.push('created_at <= ?')
    params.push(filters.createdAtTo)
  }

  const whereClause = whereConditions.join(' AND ')
  const [rows] = await db.execute(
    `SELECT COUNT(*) as total FROM UserAccount WHERE ${whereClause}`,
    params
  )
  return rows[0].total
}

// ==================== CREATE ====================

async function createUser({ userAccountId, fullname, email, phone, passwordHash, roleId, createdAt }) {
  await db.execute(
    `INSERT INTO UserAccount
      (user_account_id, fullname, email, phone, password_hash, role_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userAccountId, fullname, email, phone, passwordHash, roleId, createdAt]
  )
}

// ==================== UPDATE ====================

async function update(userAccountId, { fullname, phone }) {
  const updates = []
  const values = []

  if (fullname !== undefined) {
    updates.push('fullname = ?')
    values.push(fullname)
  }
  if (phone !== undefined) {
    updates.push('phone = ?')
    values.push(phone)
  }

  if (updates.length === 0) return

  values.push(userAccountId)
  await db.execute(`UPDATE UserAccount SET ${updates.join(', ')} WHERE user_account_id = ?`, values)
}

async function updateRole(userAccountId, roleId) {
  await db.execute('UPDATE UserAccount SET role_id = ? WHERE user_account_id = ?', [roleId, userAccountId])
}

async function updateLockStatus(userAccountId, isLocked) {
  const locked = isLocked ? 1 : 0
  await db.execute(
    'UPDATE UserAccount SET is_locked = ?, ban_reason = IF(? = 0, NULL, ban_reason) WHERE user_account_id = ?',
    [locked, locked, userAccountId]
  )
}

async function updateFailedLoginCount(userAccountId, count) {
  await db.execute('UPDATE UserAccount SET failed_login_count = ? WHERE user_account_id = ?', [count, userAccountId])
}

async function updateLastLogin(userAccountId) {
  await db.execute(
    'UPDATE UserAccount SET last_login_at = ?, failed_login_count = 0 WHERE user_account_id = ?',
    [new Date(), userAccountId]
  )
}

// ==================== DELETE (Soft) ====================

async function softDeleteUser(userAccountId) {
  // Mark account as deactivated using `ban_reason` and lock it.
  await db.execute(
    'UPDATE UserAccount SET is_locked = 1, ban_reason = ? WHERE user_account_id = ?',
    [SOFT_DELETED_REASON, userAccountId]
  )
}

// ==================== UTILITY ====================

async function countByRole(roleId) {
  const [rows] = await db.execute(
    'SELECT COUNT(*) as count FROM UserAccount WHERE role_id = ? AND (ban_reason IS NULL OR ban_reason != ?)',
    [roleId, SOFT_DELETED_REASON]
  )
  return rows[0].count
}

module.exports = {
  findByEmail,
  findByPhone,
  findById,
  findAll,
  countAll,
  findWithFilters,
  countWithFilters,
  createUser,
  update,
  updateRole,
  updateLockStatus,
  updateFailedLoginCount,
  updateLastLogin,
  softDeleteUser,
  countByRole
}
