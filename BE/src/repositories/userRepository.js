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
            is_locked AS isLocked,
            created_at AS createdAt
       FROM user_accounts
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
            is_locked AS isLocked,
            created_at AS createdAt
       FROM user_accounts
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
            is_locked AS isLocked,
            created_at AS createdAt
       FROM user_accounts
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
            is_locked AS isLocked,
            created_at AS createdAt
       FROM user_accounts
      WHERE (ban_reason IS NULL OR ban_reason != ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    [SOFT_DELETED_REASON, String(limit), String(offset)]
  )
  return rows
}

async function countAll() {
  const [rows] = await db.execute(
    'SELECT COUNT(*) as total FROM user_accounts WHERE (ban_reason IS NULL OR ban_reason != ?)',
    [SOFT_DELETED_REASON]
  )
  return rows[0].total
}

// ==================== CREATE ====================

async function createUser({ userAccountId, fullname, email, phone, passwordHash, roleId, createdAt }) {
  await db.execute(
    `INSERT INTO user_accounts
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
  await db.execute(`UPDATE user_accounts SET ${updates.join(', ')} WHERE user_account_id = ?`, values)
}

async function updateRole(userAccountId, roleId) {
  await db.execute('UPDATE user_accounts SET role_id = ? WHERE user_account_id = ?', [roleId, userAccountId])
}

async function updateLockStatus(userAccountId, isLocked) {
  const locked = isLocked ? 1 : 0
  await db.execute(
    'UPDATE user_accounts SET is_locked = ?, ban_reason = IF(? = 0, NULL, ban_reason) WHERE user_account_id = ?',
    [locked, locked, userAccountId]
  )
}

// ==================== DELETE (Soft) ====================

async function softDeleteUser(userAccountId) {
  await db.execute(
    'UPDATE user_accounts SET is_locked = 1, ban_reason = ? WHERE user_account_id = ?',
    [SOFT_DELETED_REASON, userAccountId]
  )
}

// ==================== UTILITY ====================

async function countByRole(roleId) {
  const [rows] = await db.execute(
    'SELECT COUNT(*) as count FROM user_accounts WHERE role_id = ? AND (ban_reason IS NULL OR ban_reason != ?)',
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
  softDeleteUser,
  countByRole
}
