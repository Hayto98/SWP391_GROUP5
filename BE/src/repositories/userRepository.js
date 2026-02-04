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
            is_disabled AS isDisabled,
            is_locked AS isLocked,
            created_at AS createdAt
       FROM UserAccount
      WHERE email = ?
      LIMIT 1`,
    [email]
  )
  return rows[0] || null
}

async function findById(userAccountId) {
  const [rows] = await db.execute(
    `SELECT user_account_id AS userAccountId,
            fullname,
            email,
            phone,
            role_id AS roleId,
            is_disabled AS isDisabled,
            is_locked AS isLocked,
            created_at AS createdAt
       FROM UserAccount
      WHERE user_account_id = ? AND is_deleted = 0
      LIMIT 1`,
    [userAccountId]
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
            is_disabled AS isDisabled,
            is_locked AS isLocked,
            created_at AS createdAt
       FROM UserAccount
      WHERE is_deleted = 0
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    [String(limit), String(offset)]
  )
  return rows
}

async function countAll() {
  const [rows] = await db.execute('SELECT COUNT(*) as total FROM UserAccount WHERE is_deleted = 0')
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
  await db.execute('UPDATE UserAccount SET is_locked = ? WHERE user_account_id = ?', [isLocked ? 1 : 0, userAccountId])
}

// ==================== DELETE (Soft) ====================

async function softDeleteUser(userAccountId) {
  await db.execute('UPDATE UserAccount SET is_deleted = 1 WHERE user_account_id = ?', [userAccountId])
}

// ==================== UTILITY ====================

async function countByRole(roleId) {
  const [rows] = await db.execute('SELECT COUNT(*) as count FROM UserAccount WHERE role_id = ? AND is_deleted = 0', [
    roleId
  ])
  return rows[0].count
}

module.exports = {
  findByEmail,
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
