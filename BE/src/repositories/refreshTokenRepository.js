const db = require('../config/database')

async function removeByUserId(userAccountId) {
  await db.execute('DELETE FROM RefreshToken WHERE user_account_id = ?', [userAccountId])
}

async function saveRefreshToken({ refreshTokenId, userAccountId, tokenHash, expiresAt, createdAt }) {
  await db.execute(
    `INSERT INTO RefreshToken
      (refresh_token_id, user_account_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [refreshTokenId, userAccountId, tokenHash, expiresAt, createdAt]
  )
}

module.exports = {
  removeByUserId,
  saveRefreshToken
}
