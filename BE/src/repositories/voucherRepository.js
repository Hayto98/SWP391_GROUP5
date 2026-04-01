const db = require('../config/database')

async function findAvailable({ page = 1, limit = 20 } = {}) {
  const safePage = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20))
  const offset = (safePage - 1) * safeLimit

  const sql = `SELECT
      voucher_id AS voucherId,
      voucher_code AS voucherCode,
      title,
      description,
      points_required AS pointsRequired,
      quantity_remaining AS quantityRemaining,
      file_uri AS fileUri,
      is_active AS isActive,
      valid_from AS validFrom,
      valid_to AS validTo
    FROM voucher
    WHERE is_active = 1
      AND IFNULL(is_deleted, 0) = 0
      AND valid_from <= ?
      AND valid_to >= ?
      AND quantity_remaining > 0
    ORDER BY valid_to ASC
    LIMIT ? OFFSET ?`

  const serverNow = new Date()
  const params = [serverNow, serverNow, safeLimit, offset]
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

async function decrementQuantity(connection, voucherId, quantity = 1) {
  const [result] = await connection.execute(
    `UPDATE voucher
       SET quantity_remaining = quantity_remaining - ?
     WHERE voucher_id = ? AND quantity_remaining >= ?`,
    [quantity, voucherId, quantity]
  )

  return result.affectedRows
}

async function insertVoucherRedemption(
  connection,
  { redemptionId, voucherId, citizenId, pointsUsed, redeemedAt, quantity = 1, status = 'REDEEMED' }
) {
  await connection.execute(
    `INSERT INTO voucherredemption
       (voucher_redemption_id, voucher_id, citizen_id, points_used, redeemed_at, quantity, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [redemptionId, voucherId, citizenId, pointsUsed, redeemedAt, quantity, status]
  )
}

/**
 * Thêm mới Voucher
 *
 * @param {object} voucherData
 * @param {string} voucherData.voucherId
 * @param {string} voucherData.voucherCode
 * @param {string} voucherData.title
 * @param {string} voucherData.description
 * @param {number} voucherData.pointsRequired
 * @param {number} voucherData.quantityTotal
 * @param {number} voucherData.quantityRemaining
 * @param {string} voucherData.validFrom
 * @param {string} voucherData.validTo
 * @param {string} voucherData.fileUri
 * @param {number} voucherData.isActive
 * @param {Date} voucherData.createdAt
 * @returns {Promise<boolean>}
 */
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
    voucherData.fileUri || null,
    voucherData.isActive,
    voucherData.createdAt,
    voucherData.fileUri || null
  ]

  const [result] = await db.execute(query, values)
  return result.affectedRows > 0
}

async function findByVoucherCode(voucherCode) {
  const [rows] = await db.execute('SELECT * FROM voucher WHERE voucher_code = ? AND is_deleted = 0', [voucherCode])
  return rows[0] || null
}

/**
 * Lấy Voucher theo voucherId
 * @param {string} voucherId
 * @returns {Promise<object|null>}
 */
async function findById(voucherId) {
  const [rows] = await db.execute('SELECT * FROM voucher WHERE voucher_id = ? AND is_deleted = 0', [voucherId])
  return rows[0] || null
}

/**
 * Lấy Voucher theo voucherId kèm số lượng đã đổi
 * @param {string} voucherId
 * @returns {Promise<object|null>}
 */
async function getVoucherByIdWithRedemptionCount(voucherId) {
  const query = `
    SELECT v.*, COALESCE(COUNT(vr.voucher_redemption_id), 0) as redeemed_count
    FROM voucher v
    LEFT JOIN voucherredemption vr ON v.voucher_id = vr.voucher_id
    WHERE v.voucher_id = ? AND v.is_deleted = 0
    GROUP BY v.voucher_id
  `
  const [rows] = await db.execute(query, [voucherId])
  return rows[0] || null
}

/**
 * Lấy danh sách Vouchers có phân trang
 * @param {object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{data: Array, total: number}>}
 */
async function getVouchers({ limit, offset }) {
  const dataQuery = `
    SELECT * FROM voucher 
    WHERE is_deleted = 0
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `
  const countQuery = `SELECT COUNT(*) as total FROM voucher WHERE is_deleted = 0`

  // We have to cast values as string to ensure mysql2 treats them as numeric when passing to LIMIT inside prepared statements safely depending on driver configs, or just pass integers. Usually integers work fine.
  const [rows] = await db.execute(dataQuery, [String(limit), String(offset)])
  const [countResult] = await db.execute(countQuery)

  return {
    data: rows,
    total: countResult[0].total
  }
}

// ==================== UPDATE ====================

/**
 * Cập nhật thông tin Voucher
 * @param {string} voucherId
 * @param {object} updateData
 * @returns {Promise<boolean>}
 */
async function updateVoucher(voucherId, updateData) {
  const fields = []
  const values = []

  if (updateData.title !== undefined) {
    fields.push('title = ?')
    values.push(updateData.title)
  }
  if (updateData.description !== undefined) {
    fields.push('description = ?')
    values.push(updateData.description)
  }
  if (updateData.points_required !== undefined) {
    fields.push('points_required = ?')
    values.push(updateData.points_required)
  }
  if (updateData.quantity_total !== undefined) {
    fields.push('quantity_total = ?')
    values.push(updateData.quantity_total)
  }
  if (updateData.quantity_remaining !== undefined) {
    fields.push('quantity_remaining = ?')
    values.push(updateData.quantity_remaining)
  }
  if (updateData.valid_from !== undefined) {
    fields.push('valid_from = ?')
    values.push(updateData.valid_from)
  }
  if (updateData.valid_to !== undefined) {
    fields.push('valid_to = ?')
    values.push(updateData.valid_to)
  }
  if (updateData.file_uri !== undefined) {
    fields.push('file_uri = ?')
    values.push(updateData.file_uri)
  }
  if (updateData.is_active !== undefined) {
    fields.push('is_active = ?')
    values.push(updateData.is_active)
  }

  if (updateData.is_deleted !== undefined) {
    fields.push('is_deleted = ?')
    values.push(updateData.is_deleted)
  }

  if (fields.length === 0) return true

  const query = `UPDATE voucher SET ${fields.join(', ')} WHERE voucher_id = ?`
  values.push(voucherId)

  const [result] = await db.execute(query, values)
  return result.affectedRows > 0
}

/**
 * Insert a voucher using an existing connection (for transaction safety).
 * Same query as insertVoucher but runs on the provided connection.
 *
 * @param {object} voucherData
 * @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<boolean>}
 */
async function insertVoucherWithConnection(voucherData, connection) {
  const query = `
    INSERT INTO voucher (
      voucher_id, voucher_code, title, description,
      points_required, quantity_total, quantity_remaining,
      valid_from, valid_to, file_uri, is_active, created_at
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
    voucherData.fileUri || null,
    voucherData.isActive,
    voucherData.createdAt
  ]

  const [result] = await connection.execute(query, values)
  return result.affectedRows > 0
}
async function findRedeemedByCitizenId(citizenId) {
  const [rows] = await db.execute(
    `SELECT
       v.voucher_code AS voucherCode,
       v.title,
       v.file_uri AS fileUri,
       vr.points_used AS pointsUsed,
       1 AS quantity,
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
  insertVoucher,
  insertVoucherWithConnection,
  findByVoucherCode,
  findById,
  getVoucherByIdWithRedemptionCount,
  getVouchers,
  updateVoucher,
  findAvailable,
  findByIdForUpdate,
  decrementQuantity,
  insertVoucherRedemption,
  findRedeemedByCitizenId
}
