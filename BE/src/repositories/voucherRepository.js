const db = require('../config/database')

async function findAvailable({ page = 1, limit = 20 } = {}) {
  const safePage = Number(page) > 0 ? Number(page) : 1
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20))
  const offset = (safePage - 1) * safeLimit

  const sql = `SELECT
      voucher_id AS voucherId,
      title,
      points_required AS pointsRequired,
      quantity_remaining AS quantityRemaining,
      file_uri AS fileUri,
      is_active AS isActive,
      valid_from AS validFrom,
      valid_to AS validTo
    FROM voucher
    WHERE is_active = 1
      AND valid_from <= NOW()
      AND valid_to >= NOW()
      AND quantity_remaining > 0
    ORDER BY valid_to ASC
    LIMIT ? OFFSET ?`

  const params = [safeLimit, offset]
  const [rows] = await db.execute(sql, params)
  return rows
}

async function findByIdForUpdate(connection, voucherId) {
  const [rows] = await connection.execute(
    `SELECT
       voucher_id AS voucherId,
       title,
       points_required AS pointsRequired,
       quantity_remaining AS quantityRemaining,
       file_uri AS fileUri,
       is_active AS isActive,
       valid_from AS validFrom,
       valid_to AS validTo
     FROM voucher
     WHERE voucher_id = ?
     LIMIT 1 FOR UPDATE`,
    [voucherId]
  )
  return rows[0] || null
}

async function decrementQuantity(connection, voucherId) {
  await connection.execute(
    `UPDATE voucher
       SET quantity_remaining = quantity_remaining - 1
     WHERE voucher_id = ? AND quantity_remaining > 0`,
    [voucherId]
  )
}

async function insertVoucherRedemption(connection, { redemptionId, voucherId, citizenId, createdAt }) {
  await connection.execute(
    `INSERT INTO voucherredemption
       (voucher_redemption_id, voucher_id, citizen_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [redemptionId, voucherId, citizenId, createdAt]
  )
}

module.exports = { findAvailable }

