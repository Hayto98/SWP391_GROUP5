const db = require('../config/database')

async function removeByUserId(userAccountId) {
  // Option 1: Delete all refresh tokens for this user
  // Option 2: Mark them as is_used = true (Revoke). We will delete them for simplicity
  await db.execute('DELETE FROM  userverificationtoken WHERE user_account_id = ? AND verification_type = "REFRESH_TOKEN"', [userAccountId])
}

async function saveRefreshToken({ refreshTokenId, userAccountId, tokenHash, expiresAt, createdAt }) {
  await db.execute(
    `INSERT INTO userverificationtoken
      (verification_token_id, user_account_id, token, verification_type, expired_at, created_at, is_used)
     VALUES (?, ?, ?, 'REFRESH_TOKEN', ?, ?, FALSE)`,
    [refreshTokenId, userAccountId, tokenHash, expiresAt, createdAt]
  )
}

module.exports = {
  removeByUserId,
  saveRefreshToken
}
