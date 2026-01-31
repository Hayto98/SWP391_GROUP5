const db = require('../config/database')

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

async function createUser({ userAccountId, fullname, email, phone, passwordHash, roleId, createdAt }) {
  await db.execute(
    `INSERT INTO UserAccount
      (user_account_id, fullname, email, phone, password_hash, role_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userAccountId, fullname, email, phone, passwordHash, roleId, createdAt]
  )
}

module.exports = {
  findByEmail,
  createUser
}
