const db = require('../config/database')

// ==================== CREATE ====================

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

  const [result] = await db.execute(query, values)
  return result.affectedRows > 0
}

// ==================== READ ====================

/**
 * Lấy Voucher theo voucherCode để check trùng lặp
 * @param {string} voucherCode
 * @returns {Promise<object|null>}
 */
async function findByVoucherCode(voucherCode) {
  const [rows] = await db.execute('SELECT * FROM voucher WHERE voucher_code = ?', [voucherCode])
  return rows[0] || null
}

/**
 * Lấy Voucher theo voucherId
 * @param {string} voucherId
 * @returns {Promise<object|null>}
 */
async function findById(voucherId) {
  const [rows] = await db.execute('SELECT * FROM voucher WHERE voucher_id = ?', [voucherId])
  return rows[0] || null
}

/**
 * Lấy Voucher theo voucherId kèm số lượng đã đổi
 * @param {string} voucherId
 * @returns {Promise<object|null>}
 */
async function getVoucherByIdWithRedemptionCount(voucherId) {
  const query = `
    SELECT v.*, COUNT(vr.voucher_redemption_id) as redeemed_count
    FROM voucher v
    LEFT JOIN voucherredemption vr ON v.voucher_id = vr.voucher_id
    WHERE v.voucher_id = ?
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
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `
  const countQuery = `SELECT COUNT(*) as total FROM voucher`

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

  if (fields.length === 0) return true

  const query = `UPDATE voucher SET ${fields.join(', ')} WHERE voucher_id = ?`
  values.push(voucherId)

  const [result] = await db.execute(query, values)
  return result.affectedRows > 0
}

module.exports = {
  insertVoucher,
  findByVoucherCode,
  findById,
  getVoucherByIdWithRedemptionCount,
  getVouchers,
  updateVoucher
}
