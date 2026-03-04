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
    `INSERT INTO RewardConfig (reward_config_id, waste_type_id, points_per_unit, description, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [rewardConfigId, wasteTypeId, pointsPerUnit, description, createdAt, createdAt]
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
    `SELECT reward_config_id, waste_type_id, points_per_unit, description, is_active, created_at, updated_at
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
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Tìm RewardConfig theo WasteType ID
 */
async function findByWasteTypeId(wasteTypeId) {
  const [rows] = await db.execute(
    `SELECT reward_config_id, waste_type_id, points_per_unit, description, is_active, created_at, updated_at
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
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Lấy tất cả RewardConfig (có phân trang và filter)
 */
async function findAll({ isActive, limit = 20, offset = 0 } = {}) {
  let query = `SELECT SQL_CALC_FOUND_ROWS 
                 rc.reward_config_id, rc.waste_type_id, rc.points_per_unit, rc.description, 
                 rc.is_active, rc.created_at, rc.updated_at,
                 wt.waste_type_name, wt.unit_type
               FROM RewardConfig rc
               JOIN WasteType wt ON rc.waste_type_id = wt.waste_type_id
               WHERE 1=1`
  const params = []

  if (isActive !== undefined) {
    query += ` AND rc.is_active = ?`
    params.push(isActive ? 1 : 0)
  }

  query += ` ORDER BY rc.created_at DESC LIMIT ? OFFSET ?`
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
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))

  return { data, total }
}

// ==================== UPDATE ====================

/**
 * Cập nhật RewardConfig
 */
async function updateRewardConfig(rewardConfigId, { pointsPerUnit, description }) {
  const updatedAt = new Date()
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

  fields.push('updated_at = ?')
  values.push(updatedAt)

  if (fields.length === 1) {
    // Chỉ có updated_at, không có gì cần update
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
  const updatedAt = new Date()

  const [result] = await db.execute(
    `UPDATE RewardConfig SET is_active = 0, updated_at = ? WHERE reward_config_id = ?`,
    [updatedAt, rewardConfigId]
  )

  return result.affectedRows > 0
}

/**
 * Soft delete (inactive) RewardConfig theo WasteType ID
 * Dùng khi inactive WasteType
 */
async function setInactiveByWasteTypeId(wasteTypeId) {
  const updatedAt = new Date()

  const [result] = await db.execute(
    `UPDATE RewardConfig SET is_active = 0, updated_at = ? WHERE waste_type_id = ?`,
    [updatedAt, wasteTypeId]
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
