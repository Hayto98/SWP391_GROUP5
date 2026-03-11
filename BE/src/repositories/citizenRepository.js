const db = require('../config/database')

async function findByUserAccountId(userAccountId) {
  const [rows] = await db.execute(
    `SELECT citizen_id AS citizenId,
            user_account_id AS userAccountId,
            total_points AS totalPoints
       FROM citizen
      WHERE user_account_id = ?
      LIMIT 1`,
    [userAccountId]
  )

  return rows[0] || null
}

module.exports = { findByUserAccountId }
