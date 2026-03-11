const { v4: uuidv4 } = require('uuid')
const db = require('../config/database')

const OTP_TYPE = 'EMAIL_OTP'

/**
 * Xóa OTP cũ của user rồi lưu OTP mới
 */
async function saveOtp(userAccountId, otp, expiredAt) {
  // Xóa các OTP EMAIL_OTP cũ của user này
  await db.execute(
    `DELETE FROM userverificationtoken WHERE user_account_id = ? AND verification_type = ?`,
    [userAccountId, OTP_TYPE]
  )

  const verificationTokenId = uuidv4()
  await db.execute(
    `INSERT INTO userverificationtoken
      (verification_token_id, user_account_id, token, verification_type, expired_at, created_at, is_used)
     VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
    [verificationTokenId, userAccountId, otp, OTP_TYPE, expiredAt, new Date()]
  )
  return verificationTokenId
}

/**
 * Tìm OTP hợp lệ (chưa dùng, còn hạn)
 */
async function findValidOtp(userAccountId, otp) {
  const now = new Date()
  const [rows] = await db.execute(
    `SELECT verification_token_id AS verificationTokenId
       FROM userverificationtoken
      WHERE user_account_id = ?
        AND token = ?
        AND verification_type = ?
        AND is_used = FALSE
        AND expired_at > ?
      LIMIT 1`,
    [userAccountId, otp, OTP_TYPE, now]
  )
  return rows[0] || null
}

/**
 * Đánh dấu OTP đã sử dụng
 */
async function markOtpUsed(verificationTokenId) {
  await db.execute(
    `UPDATE userverificationtoken SET is_used = TRUE WHERE verification_token_id = ?`,
    [verificationTokenId]
  )
}

module.exports = { saveOtp, findValidOtp, markOtpUsed }
