const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')

// ==================== CREATE ====================

/**
 * Tạo mới một WasteType
 * @param {Object} params
 * @param {string} params.wasteTypeName - Tên loại rác
 * @param {string} params.unitType - Đơn vị (KG / LON)
 * @returns {Object} - wasteType mới tạo
 */
async function createWasteType({ wasteTypeName, unitType }) {
  const wasteTypeId = uuidv4()
  const createdAt = new Date()

  await db.execute(
    `INSERT INTO WasteType (waste_type_id, waste_type_name, unit_type, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)`,
    [wasteTypeId, wasteTypeName, unitType, createdAt, createdAt]
  )

  return {
    wasteTypeId,
    wasteTypeName,
    unitType,
    isActive: true,
    createdAt
  }
}

// ==================== READ ====================

/**
 * Tìm WasteType theo ID
 */
async function findById(wasteTypeId) {
  const [rows] = await db.execute(
    `SELECT waste_type_id, waste_type_name, unit_type, is_active, created_at, updated_at
     FROM WasteType
     WHERE waste_type_id = ?`,
    [wasteTypeId]
  )

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    wasteTypeId: row.waste_type_id,
    wasteTypeName: row.waste_type_name,
    unitType: row.unit_type,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Tìm WasteType theo tên (case-insensitive)
 */
async function findByName(wasteTypeName) {
  const [rows] = await db.execute(
    `SELECT waste_type_id, waste_type_name, unit_type, is_active, created_at, updated_at
     FROM WasteType
     WHERE LOWER(waste_type_name) = LOWER(?)`,
    [wasteTypeName]
  )

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    wasteTypeId: row.waste_type_id,
    wasteTypeName: row.waste_type_name,
    unitType: row.unit_type,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Tìm WasteType khác có cùng tên (dùng khi update để check trùng)
 */
async function findByNameExcludeId(wasteTypeName, excludeWasteTypeId) {
  const [rows] = await db.execute(
    `SELECT waste_type_id, waste_type_name, unit_type, is_active
     FROM WasteType
     WHERE LOWER(waste_type_name) = LOWER(?) AND waste_type_id != ?`,
    [wasteTypeName, excludeWasteTypeId]
  )

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    wasteTypeId: row.waste_type_id,
    wasteTypeName: row.waste_type_name,
    unitType: row.unit_type,
    isActive: row.is_active === 1
  }
}

/**
 * Lấy tất cả WasteType (có phân trang và filter)
 */
async function findAll({ isActive, limit = 20, offset = 0 } = {}) {
  let query = `SELECT SQL_CALC_FOUND_ROWS waste_type_id, waste_type_name, unit_type, is_active, created_at, updated_at
               FROM WasteType WHERE 1=1`
  const params = []

  if (isActive !== undefined) {
    query += ` AND is_active = ?`
    params.push(isActive ? 1 : 0)
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(Number(limit), Number(offset))

  const [rows] = await db.execute(query, params)
  const [countRows] = await db.execute('SELECT FOUND_ROWS() as totalCount')
  const total = countRows[0].totalCount

  const data = rows.map((row) => ({
    wasteTypeId: row.waste_type_id,
    wasteTypeName: row.waste_type_name,
    unitType: row.unit_type,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))

  return { data, total }
}

// ==================== UPDATE ====================

/**
 * Cập nhật WasteType
 */
async function updateWasteType(wasteTypeId, { wasteTypeName, unitType }) {
  const updatedAt = new Date()
  const fields = []
  const values = []

  if (wasteTypeName !== undefined) {
    fields.push('waste_type_name = ?')
    values.push(wasteTypeName)
  }

  if (unitType !== undefined) {
    fields.push('unit_type = ?')
    values.push(unitType)
  }

  fields.push('updated_at = ?')
  values.push(updatedAt)

  if (fields.length === 1) {
    // Chỉ có updated_at, không có gì cần update
    return null
  }

  const query = `UPDATE WasteType SET ${fields.join(', ')} WHERE waste_type_id = ?`
  values.push(wasteTypeId)

  const [result] = await db.execute(query, values)

  if (result.affectedRows === 0) return null

  return findById(wasteTypeId)
}

/**
 * Soft delete (inactive) WasteType
 */
async function setInactive(wasteTypeId) {
  const updatedAt = new Date()

  const [result] = await db.execute(
    `UPDATE WasteType SET is_active = 0, updated_at = ? WHERE waste_type_id = ?`,
    [updatedAt, wasteTypeId]
  )

  return result.affectedRows > 0
}

// ==================== BUSINESS RULE CHECKS ====================

/**
 * Kiểm tra xem WasteType có report đang OPEN / ACCEPTED / ASSIGNED không
 * Dùng để validate trước khi update hoặc inactive
 */
async function hasActiveReports(wasteTypeId) {
  const query = `
    SELECT COUNT(*) AS count
    FROM WasteReport wr
    WHERE wr.waste_type_id = ?
      AND (
        SELECT rst.status_name
        FROM ReportStatusHistory rsh
        JOIN ReportStatusType rst ON rsh.report_status_type_id = rst.report_status_type_id
        WHERE rsh.waste_report_id = wr.waste_report_id
        ORDER BY rsh.changed_at DESC
        LIMIT 1
      ) IN ('OPEN', 'ACCEPTED', 'ASSIGNED')
  `

  const [rows] = await db.execute(query, [wasteTypeId])
  return rows[0].count > 0
}

/**
 * Đếm số report đang OPEN hoặc chưa có status (default OPEN)
 */
async function countActiveReports(wasteTypeId) {
  // Đếm các report có status OPEN, ACCEPTED, ASSIGNED hoặc không có status (mặc định là OPEN)
  const query = `
    SELECT COUNT(*) AS count
    FROM WasteReport wr
    WHERE wr.waste_type_id = ?
      AND (
        (SELECT rst.status_name
         FROM ReportStatusHistory rsh
         JOIN ReportStatusType rst ON rsh.report_status_type_id = rst.report_status_type_id
         WHERE rsh.waste_report_id = wr.waste_report_id
         ORDER BY rsh.changed_at DESC
         LIMIT 1) IN ('OPEN', 'ACCEPTED', 'ASSIGNED')
        OR
        NOT EXISTS (
          SELECT 1 FROM ReportStatusHistory rsh2 WHERE rsh2.waste_report_id = wr.waste_report_id
        )
      )
  `

  const [rows] = await db.execute(query, [wasteTypeId])
  return rows[0].count
}

module.exports = {
  createWasteType,
  findById,
  findByName,
  findByNameExcludeId,
  findAll,
  updateWasteType,
  setInactive,
  hasActiveReports,
  countActiveReports
}
