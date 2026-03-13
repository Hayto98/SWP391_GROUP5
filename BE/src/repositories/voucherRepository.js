const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')

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
 * @param {number} voucherData.isActive
 * @param {Date} voucherData.createdAt
 * @returns {Promise<boolean>}
 */
async function insertVoucher(voucherData) {
  const query = `
    INSERT INTO voucher (
      voucher_id, voucher_code, title, description,
      points_required, quantity_total, quantity_remaining,
      valid_from, valid_to, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

module.exports = {
  insertVoucher,
  findByVoucherCode
}
