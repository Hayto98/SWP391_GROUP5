const db = require('../config/database')

async function findAvailable({ page = 1, limit = 20 } = {}) {
  const safePage = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20))
  const offset = (safePage - 1) * safeLimit

  const sql = `SELECT
      voucher_id AS voucherId,
  voucher_code AS voucherCode,
      title,
      points_required AS pointsRequired,
      quantity_remaining AS quantityRemaining,
      file_uri AS fileUri,
      is_active AS isActive,
      valid_from AS validFrom,
      valid_to AS validTo
    FROM voucher
    WHERE is_active = 1
      AND IFNULL(is_deleted, 0) = 0
      AND valid_from <= NOW()
      AND valid_to >= NOW()
      AND quantity_remaining > 0
    ORDER BY valid_to ASC
    LIMIT ? OFFSET ?`

  const params = [safeLimit, offset]
  const [rows] = await db.query(sql, params)
  return rows
}

async function findByIdForUpdate(connection, voucherId) {
  const [rows] = await connection.execute(
    `SELECT
       voucher_id AS voucherId,
       voucher_code AS voucherCode,
       title,
       points_required AS pointsRequired,
       quantity_remaining AS quantityRemaining,
       file_uri AS fileUri,
       is_active AS isActive,
       valid_from AS validFrom,
       valid_to AS validTo
     FROM voucher
     WHERE voucher_id = ?
       AND IFNULL(is_deleted, 0) = 0
     LIMIT 1 FOR UPDATE`,
    [voucherId]
  )
  return rows[0] || null
}

async function decrementQuantity(connection, voucherId) {
  const [result] = await connection.execute(
    `UPDATE voucher
       SET quantity_remaining = quantity_remaining - 1
     WHERE voucher_id = ? AND quantity_remaining > 0`,
    [voucherId]
  )

  return result.affectedRows
}

async function insertVoucherRedemption(
  connection,
  { redemptionId, voucherId, citizenId, pointsUsed, redeemedAt, status = 'REDEEMED' }
) {
  await connection.execute(
    `INSERT INTO voucherredemption
       (voucher_redemption_id, voucher_id, citizen_id, points_used, redeemed_at, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [redemptionId, voucherId, citizenId, pointsUsed, redeemedAt, status]
  )
}

async function insertVoucher(voucherData) {
  const query = `
    INSERT INTO voucher (
      voucher_id, voucher_code, title, description,
      points_required, quantity_total, quantity_remaining,
      valid_from, valid_to, is_active, created_at, file_uri
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  const values = [
    voucherData.voucherId,
    voucherData.voucherCode,
    voucherData.title,
    voucherData.description || null,
    voucherData.pointsRequired,
    voucherData.quantityTotal,
    voucherData.quantityRemaining,
    voucherData.validFrom,
    voucherData.validTo,
    voucherData.isActive,
    voucherData.createdAt,
    voucherData.fileUri || null
  ]

  const [result] = await db.execute(query, values)
  return result.affectedRows > 0
}

async function findByVoucherCode(voucherCode) {
  const [rows] = await db.execute('SELECT * FROM voucher WHERE voucher_code = ?', [voucherCode])
  return rows[0] || null
}

async function findRedeemedByCitizenId(citizenId) {
  const [rows] = await db.execute(
    `SELECT
       v.voucher_code AS voucherCode,
       v.title,
       v.file_uri AS fileUri,
       vr.points_used AS pointsUsed,
       vr.redeemed_at AS redeemedAt
     FROM voucherredemption vr
     INNER JOIN voucher v ON vr.voucher_id = v.voucher_id
     WHERE vr.citizen_id = ?
     ORDER BY vr.redeemed_at DESC`,
    [citizenId]
  )

  return rows
}

module.exports = {
  findAvailable,
  findByIdForUpdate,
  decrementQuantity,
  insertVoucherRedemption,
  insertVoucher,
  findByVoucherCode,
  findRedeemedByCitizenId
}
