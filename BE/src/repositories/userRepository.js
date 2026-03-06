const db = require('../config/database')
const { ROLES } = require('../utils/constants')

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

async function findAll({ limit = 20, offset = 0, keyword, roleId } = {}) {
  const conditions = ['(ban_reason IS NULL OR ban_reason != ?)']
  const params = [SOFT_DELETED_REASON]

  if (keyword && keyword.trim()) {
    const searchTerm = `%${keyword.trim()}%`
    conditions.push('(fullname LIKE ? OR email LIKE ? OR phone LIKE ?)')
    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (roleId !== undefined && roleId !== null && roleId !== '') {
    conditions.push('role_id = ?')
    params.push(Number(roleId))
  }

  const whereClause = conditions.join(' AND ')
  params.push(String(limit), String(offset))

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
      WHERE ${whereClause}
      ORDER BY role_id ASC, created_at DESC
      LIMIT ? OFFSET ?`,
    params
  )
  return rows
}

async function countAll({ keyword, roleId } = {}) {
  const conditions = ['(ban_reason IS NULL OR ban_reason != ?)']
  const params = [SOFT_DELETED_REASON]

  if (keyword && keyword.trim()) {
    const searchTerm = `%${keyword.trim()}%`
    conditions.push('(fullname LIKE ? OR email LIKE ? OR phone LIKE ?)')
    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (roleId !== undefined && roleId !== null && roleId !== '') {
    conditions.push('role_id = ?')
    params.push(Number(roleId))
  }

  const whereClause = conditions.join(' AND ')
  const [rows] = await db.execute(`SELECT COUNT(*) as total FROM UserAccount WHERE ${whereClause}`, params)
  return rows[0].total
}

// ==================== CREATE ====================

async function createUser({ userAccountId, fullname, email, phone, passwordHash, roleId, createdAt }) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Insert into UserAccount
    await connection.execute(
      `INSERT INTO UserAccount
        (user_account_id, fullname, email, phone, password_hash, role_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userAccountId, fullname, email, phone, passwordHash, roleId, createdAt]
    )

    // 2. Insert into role-specific table if necessary
    const { v4: uuidv4 } = require('uuid')

    if (roleId === ROLES.CITIZEN) {
      // CITIZEN
      await connection.execute(
        `INSERT INTO Citizen (citizen_id, user_account_id, total_points, created_at)
         VALUES (?, ?, 0, ?)`,
        [uuidv4(), userAccountId, createdAt]
      )
    } else if (roleId === ROLES.COLLECTOR) {
      // COLLECTOR
      // Collector references user_account_id trực tiếp, không cần insert bảng riêng.
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// ==================== UPDATE ====================

async function update(userAccountId, { fullname, phone, roleId, isLocked, banReason }) {
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
  if (roleId !== undefined) {
    updates.push('role_id = ?')
    values.push(roleId)
  }
  if (isLocked !== undefined) {
    updates.push('is_locked = ?')
    values.push(isLocked ? 1 : 0)
  }
  if (banReason !== undefined) {
    updates.push('ban_reason = ?')
    values.push(banReason)
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
  await db.execute('UPDATE UserAccount SET last_login_at = ?, failed_login_count = 0 WHERE user_account_id = ?', [
    new Date(),
    userAccountId
  ])
}

// ==================== DELETE (Soft) ====================

async function softDeleteUser(userAccountId) {
  await db.execute('UPDATE UserAccount SET is_locked = 1, ban_reason = ? WHERE user_account_id = ?', [
    SOFT_DELETED_REASON,
    userAccountId
  ])
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
  createUser,
  update,
  updateRole,
  updateLockStatus,
  updateFailedLoginCount,
  updateLastLogin,
  softDeleteUser,
  countByRole
}