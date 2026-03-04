const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')

// ==================== CREATE ====================

/**
 * Tạo mới RewardConfig cho một WasteType
 * @param {Object} params
 * @param {string} params.wasteTypeId - ID của WasteType
 * @param {number} params.pointsPerUnit - Số điểm mỗi đơn vị
 * @param {string} [params.description] - Mô tả
 * @returns {Object} - rewardConfig mới tạo
 */
async function createRewardConfig({ wasteTypeId, pointsPerUnit, description = null }) {
  const rewardConfigId = uuidv4()
  const createdAt = new Date()

  await db.execute(
    `INSERT INTO RewardConfig (reward_config_id, waste_type_id, points_per_unit, description, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [rewardConfigId, wasteTypeId, pointsPerUnit, description]
  )

  return {
    rewardConfigId,
    wasteTypeId,
    pointsPerUnit,
    description,
    isActive: true,
    createdAt
  }
}

// ==================== READ ====================

/**
 * Tìm RewardConfig theo ID
 */
async function findById(rewardConfigId) {
  const [rows] = await db.execute(
    `SELECT reward_config_id, waste_type_id, points_per_unit, description, is_active
     FROM RewardConfig
     WHERE reward_config_id = ?`,
    [rewardConfigId]
  )

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    rewardConfigId: row.reward_config_id,
    wasteTypeId: row.waste_type_id,
    pointsPerUnit: row.points_per_unit,
    description: row.description,
    isActive: row.is_active === 1,
    createdAt: null,
    updatedAt: null
  }
}

/**
 * Tìm RewardConfig theo WasteType ID
 */
async function findByWasteTypeId(wasteTypeId) {
  const [rows] = await db.execute(
    `SELECT reward_config_id, waste_type_id, points_per_unit, description, is_active
     FROM RewardConfig
     WHERE waste_type_id = ?`,
    [wasteTypeId]
  )

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    rewardConfigId: row.reward_config_id,
    wasteTypeId: row.waste_type_id,
    pointsPerUnit: row.points_per_unit,
    description: row.description,
    isActive: row.is_active === 1,
    createdAt: null,
    updatedAt: null
  }
}

/**
 * Lấy tất cả RewardConfig (có phân trang và filter)
 */
async function findAll({ isActive, limit = 20, offset = 0 } = {}) {
  let query = `SELECT SQL_CALC_FOUND_ROWS 
                 rc.reward_config_id, rc.waste_type_id, rc.points_per_unit, rc.description, 
                 rc.is_active,
                 wt.waste_type_name, wt.unit_type
               FROM RewardConfig rc
               JOIN WasteType wt ON rc.waste_type_id = wt.waste_type_id
               WHERE 1=1`
  const params = []

  if (isActive !== undefined) {
    query += ` AND rc.is_active = ?`
    params.push(isActive ? 1 : 0)
  }

  query += ` ORDER BY rc.reward_config_id DESC LIMIT ? OFFSET ?`
  params.push(Number(limit), Number(offset))

  const [rows] = await db.execute(query, params)
  const [countRows] = await db.execute('SELECT FOUND_ROWS() as totalCount')
  const total = countRows[0].totalCount

  const data = rows.map((row) => ({
    rewardConfigId: row.reward_config_id,
    wasteTypeId: row.waste_type_id,
    wasteTypeName: row.waste_type_name,
    unitType: row.unit_type,
    pointsPerUnit: row.points_per_unit,
    description: row.description,
    isActive: row.is_active === 1,
    createdAt: null,
    updatedAt: null
  }))

  return { data, total }
}

// ==================== UPDATE ====================

/**
 * Cập nhật RewardConfig
 */
async function updateRewardConfig(rewardConfigId, { pointsPerUnit, description }) {
  const fields = []
  const values = []

  if (pointsPerUnit !== undefined) {
    fields.push('points_per_unit = ?')
    values.push(pointsPerUnit)
  }

  if (description !== undefined) {
    fields.push('description = ?')
    values.push(description)
  }

  if (fields.length === 0) {
    // Không có gì để update
    return null
  }

  const query = `UPDATE RewardConfig SET ${fields.join(', ')} WHERE reward_config_id = ?`
  values.push(rewardConfigId)

  const [result] = await db.execute(query, values)

  if (result.affectedRows === 0) return null

  return findById(rewardConfigId)
}

/**
 * Soft delete (inactive) RewardConfig
 */
async function setInactive(rewardConfigId) {
  const [result] = await db.execute(
    `UPDATE RewardConfig SET is_active = 0 WHERE reward_config_id = ?`,
    [rewardConfigId]
  )

  return result.affectedRows > 0
}

/**
 * Soft delete (inactive) RewardConfig theo WasteType ID
 * Dùng khi inactive WasteType
 */
async function setInactiveByWasteTypeId(wasteTypeId) {
  const [result] = await db.execute(
    `UPDATE RewardConfig SET is_active = 0 WHERE waste_type_id = ?`,
    [wasteTypeId]
  )

  return result.affectedRows > 0
}

module.exports = {
  createRewardConfig,
  findById,
  findByWasteTypeId,
  findAll,
  updateRewardConfig,
  setInactive,
  setInactiveByWasteTypeId
}
