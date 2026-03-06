const db = require('../config/database')
// ==================== CREATE ====================

/**
 * Tạo mới một WasteType
 * @param {Object} params
 * @param {string} params.wasteTypeName - Tên loại rác
 * @param {string} params.unitType - Đơn vị (KG / LON)
 * @returns {Object} - wasteType mới tạo
 */
async function createWasteType({ wasteTypeName, unitType }) {
  const createdAt = new Date()

  const [result] = await db.execute(
    `INSERT INTO WasteType (waste_type_name, unit_type, is_active)
     VALUES (?, ?, 1)`,
    [wasteTypeName, unitType]
  )

  const wasteTypeId = result.insertId

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
    `SELECT waste_type_id, waste_type_name, unit_type, is_active, IFNULL(is_deleted,0) AS is_deleted
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
    isDeleted: row.is_deleted === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Tìm WasteType theo tên (case-insensitive)
 */
async function findByName(wasteTypeName) {
  const [rows] = await db.execute(
    `SELECT waste_type_id, waste_type_name, unit_type, is_active
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
  let query = `SELECT SQL_CALC_FOUND_ROWS waste_type_id, waste_type_name, unit_type, is_active
               FROM WasteType WHERE 1=1 AND IFNULL(is_deleted,0) = 0`
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
    isActive: row.is_active === 1
  }))

  return { data, total }
}

/**
 * Lấy tất cả WasteType kèm RewardConfig (LEFT JOIN)
 * includeInactiveReward: nếu false -> chỉ lấy RewardConfig is_active = 1
 */
async function findAllWithRewardConfig({
  isActive,
  unitType,
  includeInactiveReward = false,
  limit = 20,
  offset = 0
} = {}) {
  // Embed LIMIT/OFFSET as literals to avoid mysql2 prepared-statement type errors
  const limitInt = Math.max(1, parseInt(limit, 10) || 20)
  const offsetInt = Math.max(0, parseInt(offset, 10) || 0)

  // Build JOIN clause
  const joinCondition = includeInactiveReward
    ? `ON wt.waste_type_id = rc.waste_type_id`
    : `ON wt.waste_type_id = rc.waste_type_id AND rc.is_active = 1`

  let whereClause = `WHERE 1=1`
  // Exclude soft-deleted rows by default
  whereClause += ` AND wt.is_deleted = 0`
  const params = []

  if (isActive !== undefined) {
    whereClause += ` AND wt.is_active = ?`
    params.push(isActive ? 1 : 0)
  }

  if (unitType !== undefined && unitType !== null && unitType !== '') {
    whereClause += ` AND wt.unit_type = ?`
    params.push(unitType)
  }

  const dataQuery = `
    SELECT
      wt.waste_type_id,
      wt.waste_type_name,
      wt.unit_type,
      wt.is_active,
      rc.reward_config_id,
        rc.points_per_unit,
        rc.description,
        rc.allowed_variance_percent,
        rc.is_active AS rc_is_active
    FROM WasteType wt
    LEFT JOIN RewardConfig rc ${joinCondition}
    ${whereClause}
    ORDER BY wt.waste_type_name ASC
    LIMIT ${limitInt} OFFSET ${offsetInt}
  `

  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM WasteType wt
    ${whereClause}
  `

  const [rows] = await db.execute(dataQuery, params)
  const [countRows] = await db.execute(countQuery, params)
  const total = countRows[0].totalCount

  const data = rows.map((row) => ({
    wasteTypeId: row.waste_type_id,
    wasteTypeName: row.waste_type_name,
    unitType: row.unit_type,
    isActive: row.is_active === 1,
    rewardConfig: row.reward_config_id
      ? {
          rewardConfigId: row.reward_config_id,
          pointsPerUnit: row.points_per_unit,
          description: row.description,
          allowedVariancePercent: row.allowed_variance_percent,
          isActive: row.rc_is_active === 1
        }
      : null
  }))

  return { data, total }
}
/**
 * Lấy một WasteType theo ID kèm RewardConfig (LEFT JOIN)
 */
async function findByIdWithRewardConfig(wasteTypeId, { includeInactiveReward = false } = {}) {
  let query = `SELECT
                 wt.waste_type_id, wt.waste_type_name, wt.unit_type, wt.is_active, IFNULL(wt.is_deleted,0) AS is_deleted,
                 rc.reward_config_id, rc.points_per_unit, rc.description, rc.allowed_variance_percent, rc.is_active AS rc_is_active
               FROM WasteType wt
               LEFT JOIN RewardConfig rc ON wt.waste_type_id = rc.waste_type_id`

  if (!includeInactiveReward) {
    query += ` AND rc.is_active = 1`
  }

  query += ` WHERE wt.waste_type_id = ? LIMIT 1`

  const params = [wasteTypeId]

  const [rows] = await db.execute(query, params)
  if (rows.length === 0) return null

  const row = rows[0]
  return {
    wasteTypeId: row.waste_type_id,
    wasteTypeName: row.waste_type_name,
    unitType: row.unit_type,
    isActive: row.is_active === 1,
    isDeleted: row.is_deleted === 1,
    rewardConfig: row.reward_config_id
      ? {
          rewardConfigId: row.reward_config_id,
          pointsPerUnit: row.points_per_unit,
          description: row.description,
          allowedVariancePercent: row.allowed_variance_percent,
          isActive: row.rc_is_active === 1
        }
      : null
  }
}

// ==================== UPDATE ====================

/**
 * Cập nhật WasteType
 */
async function updateWasteType(wasteTypeId, { wasteTypeName, unitType }) {
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

  if (fields.length === 0) {
    // Không có trường nào để update
    return null
  }

  const query = `UPDATE WasteType SET ${fields.join(', ')} WHERE waste_type_id = ?`
  values.push(wasteTypeId)

  const [result] = await db.execute(query, values)

  if (result.affectedRows === 0) return null

  return findById(wasteTypeId)
}

/**
 * Set WasteType active status
 */
async function setActiveStatus(wasteTypeId, isActive) {
  const [result] = await db.execute(
    `UPDATE WasteType SET is_active = ? WHERE waste_type_id = ?`,
    [isActive ? 1 : 0, wasteTypeId]
  )

  return result.affectedRows > 0
}

/**
 * Soft delete marker for WasteType
 */
async function setSoftDelete(wasteTypeId) {
  const [result] = await db.execute(
    `UPDATE WasteType SET is_deleted = 1 WHERE waste_type_id = ?`,
    [wasteTypeId]
  )

  return result.affectedRows > 0
}

/**
 * Soft delete (inactive) WasteType - deprecated, use setActiveStatus
 */
async function setInactive(wasteTypeId) {
  return setActiveStatus(wasteTypeId, false)
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
/**
 * Lấy danh sách WasteType đang active kèm RewardConfig active
 */
async function findActiveWithReward() {
  const [rows] = await db.execute(
    `SELECT wt.waste_type_id     AS wasteTypeId,
            wt.waste_type_name   AS wasteTypeName,
            wt.unit_type         AS unitType,
            wt.is_active         AS isActive,
            rc.points_per_unit   AS pointsPerUnit,
            rc.description       AS description
       FROM WasteType wt
       JOIN RewardConfig rc ON wt.waste_type_id = rc.waste_type_id
      WHERE wt.is_active = 1
        AND rc.is_active = 1
      ORDER BY wt.waste_type_name ASC`
  )
  return rows
}

async function findByIdWithReward(wasteTypeId) {
  const [rows] = await db.execute(
    `SELECT wt.waste_type_id        AS wasteTypeId,
            wt.waste_type_name      AS wasteTypeName,
            wt.unit_type            AS unitType,
            wt.is_active            AS isActive,
            rc.reward_config_id     AS rewardConfigId,
            rc.points_per_unit      AS pointsPerUnit,
            rc.description          AS description,
            rc.is_active            AS rewardConfigActive
       FROM WasteType wt
       LEFT JOIN RewardConfig rc
         ON wt.waste_type_id = rc.waste_type_id
        AND rc.is_active = 1
      WHERE wt.waste_type_id = ?
      LIMIT 1`,
    [wasteTypeId]
  )

  return rows[0] || null
}

module.exports = {
  createWasteType,
  findById,
  findByName,
  findByNameExcludeId,
  findAll,
  findAllWithRewardConfig,
  findByIdWithRewardConfig,
  updateWasteType,
  setActiveStatus,
  setInactive,
  setSoftDelete,
  hasActiveReports,
  countActiveReports,
  findActiveWithReward,
  findByIdWithReward
}
