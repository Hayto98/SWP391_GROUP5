const ApiError = require('../errors/ApiError')
const wasteTypeRepository = require('../repositories/wasteTypeRepository')
const rewardConfigRepository = require('../repositories/rewardConfigRepository')

// ==================== CONSTANTS ====================

const VALID_UNIT_TYPES = ['KG', 'LON']

// ==================== WASTE TYPE SERVICES ====================

/**
 * BE-5: Tạo WasteType mới
 * POST /enterprise/waste-types
 *
 * Business Rules:
 * - Tên không được trùng
 * - unitType bắt buộc (KG / LON)
 * - is_active mặc định = true
 */
async function createWasteType({ wasteTypeName, unitType }) {
  // Validate required fields
  if (!wasteTypeName || !wasteTypeName.trim()) {
    throw new ApiError(400, 'wasteTypeName is required')
  }

  if (!unitType) {
    throw new ApiError(400, 'unitType is required')
  }

  // Validate unitType
  const normalizedUnitType = unitType.toUpperCase()
  if (!VALID_UNIT_TYPES.includes(normalizedUnitType)) {
    throw new ApiError(400, `unitType must be one of: ${VALID_UNIT_TYPES.join(', ')}`)
  }

  // Check unique name
  const existingType = await wasteTypeRepository.findByName(wasteTypeName.trim())
  if (existingType) {
    throw new ApiError(409, 'WasteType với tên này đã tồn tại')
  }

  // Create waste type
  const result = await wasteTypeRepository.createWasteType({
    wasteTypeName: wasteTypeName.trim(),
    unitType: normalizedUnitType
  })

  return {
    success: true,
    data: {
      wasteTypeId: result.wasteTypeId,
      wasteTypeName: result.wasteTypeName,
      unitType: result.unitType
    }
  }
}

/**
 * BE-7: Cập nhật WasteType
 * PUT /enterprise/waste-types/:wasteTypeId
 *
 * Business Rules:
 * - wasteType phải tồn tại
 * - Không cho đổi nếu đang có report ở trạng thái OPEN / ACCEPTED / ASSIGNED
 * - Tên không trùng với wasteType khác
 * - unitType chỉ nhận: KG hoặc LON
 * - Không cho update nếu is_active = false (đã inactive)
 */
async function updateWasteType(wasteTypeId, { wasteTypeName, unitType }) {
  // Check existence
  const existingType = await wasteTypeRepository.findById(wasteTypeId)
  if (!existingType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // Check if already inactive
  if (!existingType.isActive) {
    throw new ApiError(400, 'Không thể cập nhật WasteType đã inactive')
  }

  // Check for active reports
  const hasActiveReports = await wasteTypeRepository.hasActiveReports(wasteTypeId)
  if (hasActiveReports) {
    throw new ApiError(400, 'Không thể cập nhật WasteType khi có report đang OPEN / ACCEPTED / ASSIGNED')
  }

  // Validate fields
  const updateData = {}

  if (wasteTypeName !== undefined) {
    if (!wasteTypeName.trim()) {
      throw new ApiError(400, 'wasteTypeName không được để trống')
    }

    // Check unique name (exclude current)
    const duplicateName = await wasteTypeRepository.findByNameExcludeId(wasteTypeName.trim(), wasteTypeId)
    if (duplicateName) {
      throw new ApiError(409, 'WasteType với tên này đã tồn tại')
    }

    updateData.wasteTypeName = wasteTypeName.trim()
  }

  if (unitType !== undefined) {
    const normalizedUnitType = unitType.toUpperCase()
    if (!VALID_UNIT_TYPES.includes(normalizedUnitType)) {
      throw new ApiError(400, `unitType must be one of: ${VALID_UNIT_TYPES.join(', ')}`)
    }
    updateData.unitType = normalizedUnitType
  }

  // Perform update
  const result = await wasteTypeRepository.updateWasteType(wasteTypeId, updateData)

  if (!result) {
    throw new ApiError(400, 'Không có gì để cập nhật')
  }

  return {
    success: true,
    data: {
      wasteTypeId: result.wasteTypeId,
      wasteTypeName: result.wasteTypeName,
      unitType: result.unitType,
      updatedAt: result.updatedAt
    }
  }
}

/**
 * BE-8: Inactive WasteType (Soft Delete)
 * PATCH /enterprise/waste-types/:wasteTypeId/inactive
 *
 * Business Rules:
 * - wasteType tồn tại
 * - Không được inactive nếu có report đang OPEN / ACCEPTED / ASSIGNED
 * - Update is_active = false
 * - Đồng thời inactive RewardConfig liên quan
 */
async function inactiveWasteType(wasteTypeId) {
  // Check existence
  const existingType = await wasteTypeRepository.findById(wasteTypeId)
  if (!existingType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // Check if already inactive
  if (!existingType.isActive) {
    throw new ApiError(400, 'WasteType đã inactive từ trước')
  }

  // Check for active reports
  const activeReportCount = await wasteTypeRepository.countActiveReports(wasteTypeId)
  if (activeReportCount > 0) {
    throw new ApiError(400, `Không thể inactive WasteType khi có ${activeReportCount} report(s) đang OPEN / ACCEPTED / ASSIGNED`)
  }

  // Inactive WasteType
  await wasteTypeRepository.setInactive(wasteTypeId)

  // Inactive related RewardConfig
  await rewardConfigRepository.setInactiveByWasteTypeId(wasteTypeId)

  return {
    success: true,
    data: {
      wasteTypeId: wasteTypeId,
      isActive: false
    }
  }
}

/**
 * Get all WasteTypes (with optional filtering)
 */
async function getAllWasteTypes({ isActive, page = 1, limit = 20 } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  const filters = {}
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    filters.isActive = isActive === 'true' || isActive === true
  }

  const result = await wasteTypeRepository.findAll({
    isActive: filters.isActive,
    limit: limitNum,
    offset
  })

  // Remove createdAt and updatedAt from response
  const filteredData = result.data.map(({ createdAt, updatedAt, ...rest }) => rest)

  return {
    success: true,
    data: filteredData,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: result.total,
      totalPages: Math.ceil(result.total / limitNum)
    }
  }
}

/**
 * Get WasteType by ID
 */
async function getWasteTypeById(wasteTypeId) {
  const wasteType = await wasteTypeRepository.findById(wasteTypeId)
  if (!wasteType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // Remove createdAt and updatedAt from response
  const { createdAt, updatedAt, ...filteredData } = wasteType

  return {
    success: true,
    data: filteredData
  }
}

// ==================== REWARD CONFIG SERVICES ====================

/**
 * BE-6: Tạo RewardConfig cho WasteType
 * POST /enterprise/reward-config
 *
 * Business Rules:
 * - 1 wasteType chỉ có 1 reward config (unique)
 * - pointsPerUnit > 0
 * - is_active = true
 * - Phù hợp BR-18, BR-58
 */
async function createRewardConfig({ wasteTypeId, pointsPerUnit, description }) {
  // Validate required fields
  if (!wasteTypeId) {
    throw new ApiError(400, 'wasteTypeId is required')
  }

  if (pointsPerUnit === undefined || pointsPerUnit === null) {
    throw new ApiError(400, 'pointsPerUnit is required')
  }

  // Validate pointsPerUnit > 0
  const points = Number(pointsPerUnit)
  if (isNaN(points) || points <= 0) {
    throw new ApiError(400, 'pointsPerUnit phải là số dương lớn hơn 0')
  }

  // Check wasteType exists
  const wasteType = await wasteTypeRepository.findById(wasteTypeId)
  if (!wasteType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // Check wasteType is active
  if (!wasteType.isActive) {
    throw new ApiError(400, 'Không thể tạo RewardConfig cho WasteType đã inactive')
  }

  // Check unique - 1 wasteType chỉ có 1 reward config
  const existingConfig = await rewardConfigRepository.findByWasteTypeId(wasteTypeId)
  if (existingConfig) {
    throw new ApiError(409, 'WasteType đã có RewardConfig. Mỗi WasteType chỉ có 1 RewardConfig.')
  }

  // Create reward config
  const result = await rewardConfigRepository.createRewardConfig({
    wasteTypeId,
    pointsPerUnit: points,
    description: description || null
  })

  return {
    success: true,
    data: {
      reward_config_id: result.rewardConfigId,
      waste_type_id: result.wasteTypeId,
      points_per_unit: result.pointsPerUnit,
      description: result.description,
      is_active: result.isActive === 1 || result.isActive === true,
      created_at: result.createdAt
    }
  }
}

/**
 * BE-9: Cập nhật RewardConfig
 * PUT /enterprise/reward-config/:rewardConfigId
 *
 * Business Rules:
 * - rewardConfig tồn tại
 * - pointsPerUnit > 0
 * - Không cho update nếu wasteType đang inactive
 * - Không cho update nếu rewardConfig đang inactive
 */
async function updateRewardConfig(rewardConfigId, { pointsPerUnit, description }) {
  // Check existence
  const existingConfig = await rewardConfigRepository.findById(rewardConfigId)
  if (!existingConfig) {
    throw new ApiError(404, 'RewardConfig không tồn tại')
  }

  // Check if rewardConfig is active
  if (!existingConfig.isActive) {
    throw new ApiError(400, 'Không thể cập nhật RewardConfig đã inactive')
  }

  // Check if related wasteType is active
  const wasteType = await wasteTypeRepository.findById(existingConfig.wasteTypeId)
  if (!wasteType || !wasteType.isActive) {
    throw new ApiError(400, 'Không thể cập nhật RewardConfig khi WasteType đã inactive')
  }

  // Validate and build update data
  const updateData = {}

  if (pointsPerUnit !== undefined) {
    const points = Number(pointsPerUnit)
    if (isNaN(points) || points <= 0) {
      throw new ApiError(400, 'pointsPerUnit phải là số dương lớn hơn 0')
    }
    updateData.pointsPerUnit = points
  }

  if (description !== undefined) {
    updateData.description = description
  }

  // Perform update
  const result = await rewardConfigRepository.updateRewardConfig(rewardConfigId, updateData)

  if (!result) {
    throw new ApiError(400, 'Không có gì để cập nhật')
  }

  return {
    success: true,
    data: {
      reward_config_id: result.rewardConfigId,
      points_per_unit: result.pointsPerUnit,
      updated_at: result.updatedAt
    }
  }
}

/**
 * Get all RewardConfigs (with optional filtering)
 */
async function getAllRewardConfigs({ isActive, page = 1, limit = 20 } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  const filters = {}
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    filters.isActive = isActive === 'true' || isActive === true
  }

  const result = await rewardConfigRepository.findAll({
    isActive: filters.isActive,
    limit: limitNum,
    offset
  })

  const mapped = result.data.map((r) => ({
    reward_config_id: r.rewardConfigId,
    waste_type_id: r.wasteTypeId,
    waste_type_name: r.wasteTypeName,
    unit_type: r.unitType,
    points_per_unit: r.pointsPerUnit,
    description: r.description,
    is_active: r.isActive === 1 || r.isActive === true,
    created_at: r.createdAt
  }))

  return {
    success: true,
    data: mapped,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: result.total,
      totalPages: Math.ceil(result.total / limitNum)
    }
  }
}

/**
 * Get RewardConfig by ID
 */
async function getRewardConfigById(rewardConfigId) {
  const config = await rewardConfigRepository.findById(rewardConfigId)
  if (!config) {
    throw new ApiError(404, 'RewardConfig không tồn tại')
  }

  return {
    success: true,
    data: {
      reward_config_id: config.rewardConfigId,
      waste_type_id: config.wasteTypeId,
      points_per_unit: config.pointsPerUnit,
      description: config.description,
      is_active: config.isActive === 1 || config.isActive === true,
      created_at: config.createdAt
    }
  }
}

/**
 * Get RewardConfig by WasteType ID
 */
async function getRewardConfigByWasteTypeId(wasteTypeId) {
  const config = await rewardConfigRepository.findByWasteTypeId(wasteTypeId)
  if (!config) {
    throw new ApiError(404, 'RewardConfig không tồn tại cho WasteType này')
  }

  return {
    success: true,
    data: {
      reward_config_id: config.rewardConfigId,
      waste_type_id: config.wasteTypeId,
      points_per_unit: config.pointsPerUnit,
      description: config.description,
      is_active: config.isActive === 1 || config.isActive === true,
      created_at: config.createdAt
    }
  }
}

module.exports = {
  // WasteType
  createWasteType,
  updateWasteType,
  inactiveWasteType,
  getAllWasteTypes,
  getWasteTypeById,

  // RewardConfig
  createRewardConfig,
  updateRewardConfig,
  getAllRewardConfigs,
  getRewardConfigById,
  getRewardConfigByWasteTypeId
}
