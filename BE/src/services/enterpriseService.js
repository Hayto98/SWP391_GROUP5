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
 * BE-8: Toggle WasteType Active Status
 * PATCH /enterprise/waste-types/:wasteTypeId/status
 *
 * Business Rules:
 * - wasteType phải tồn tại
 * - Nếu set isActive = false → kiểm tra có report OPEN/ACCEPTED/ASSIGNED không
 * - Nếu hợp lệ → update is_active = isActive
 * - Nếu set isActive = false → đồng thời inactive RewardConfig
 * - Nếu set isActive = true → không tự động active RewardConfig
 */
async function toggleWasteTypeStatus(wasteTypeId, isActive) {
  // Validate isActive is boolean
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean (true/false)')
  }

  // Check existence
  const existingType = await wasteTypeRepository.findById(wasteTypeId)
  if (!existingType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // If deactivating, check for active reports
  if (isActive === false) {
    const activeReportCount = await wasteTypeRepository.countActiveReports(wasteTypeId)
    if (activeReportCount > 0) {
      throw new ApiError(400, 'Cannot deactivate WasteType because there are active reports')
    }

    // Inactive related RewardConfig
    await rewardConfigRepository.setInactiveByWasteTypeId(wasteTypeId)
  }

  // Update WasteType active status
  await wasteTypeRepository.setActiveStatus(wasteTypeId, isActive)

  return {
    success: true,
    data: {
      wasteTypeId: wasteTypeId,
      isActive: isActive
    }
  }
}

/**
 * Get all WasteTypes (with optional filtering)
 */
async function getAllWasteTypes({ isActive, page = 1, limit = 20, unitType, includeInactiveReward } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  const filters = {}
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    filters.isActive = isActive === 'true' || isActive === true
  }

  // Validate unitType if provided
  if (unitType !== undefined && unitType !== null && unitType !== '') {
    const normalized = String(unitType).toUpperCase()
    if (!VALID_UNIT_TYPES.includes(normalized)) {
      throw new ApiError(400, `unitType must be one of: ${VALID_UNIT_TYPES.join(', ')}`)
    }
    filters.unitType = normalized
  }

  // includeInactiveReward default false
  const includeInactive = includeInactiveReward === 'true' || includeInactiveReward === true

  const result = await wasteTypeRepository.findAllWithRewardConfig({
    isActive: filters.isActive,
    unitType: filters.unitType,
    includeInactiveReward: includeInactive,
    limit: limitNum,
    offset
  })

  // Map response to expected shape and include pagination
  const mapped = result.data.map((wt) => ({
    wasteTypeId: wt.wasteTypeId,
    wasteTypeName: wt.wasteTypeName,
    unitType: wt.unitType,
    isActive: wt.isActive,
    // createdAt intentionally omitted per API spec
    rewardConfig: wt.rewardConfig
      ? {
          rewardConfigId: wt.rewardConfig.rewardConfigId,
          pointsPerUnit: wt.rewardConfig.pointsPerUnit,
          description: wt.rewardConfig.description,
          allowedVariancePercent: wt.rewardConfig.allowedVariancePercent,
          isActive: wt.rewardConfig.isActive
        }
      : null
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
 * Get WasteType by ID
 */
async function getWasteTypeById(wasteTypeId) {
  // include inactive reward configs? default false — follow same behavior as list
  const wasteType = await wasteTypeRepository.findByIdWithRewardConfig(wasteTypeId, { includeInactiveReward: false })
  if (!wasteType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // If the waste type was soft-deleted, treat as not found for public GET
  if (wasteType.isDeleted) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  return {
    success: true,
    data: {
      wasteTypeId: wasteType.wasteTypeId,
      wasteTypeName: wasteType.wasteTypeName,
      unitType: wasteType.unitType,
      isActive: wasteType.isActive,
      rewardConfig: wasteType.rewardConfig
        ? {
            rewardConfigId: wasteType.rewardConfig.rewardConfigId,
            pointsPerUnit: wasteType.rewardConfig.pointsPerUnit,
            description: wasteType.rewardConfig.description,
            allowedVariancePercent: wasteType.rewardConfig.allowedVariancePercent,
            isActive: wasteType.rewardConfig.isActive
          }
        : null
    }
  }
}

/**
 * BE-12: Soft delete WasteType
 */
async function deleteWasteType(wasteTypeId) {
  const existingType = await wasteTypeRepository.findById(wasteTypeId)
  if (!existingType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  if (existingType.isDeleted) {
    throw new ApiError(400, 'WasteType đã bị xóa trước đó')
  }

  // Soft delete marker only; do NOT change RewardConfig
  await wasteTypeRepository.setSoftDelete(wasteTypeId)

  return {
    success: true,
    message: 'WasteType đã được xóa'
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
async function createRewardConfig({ wasteTypeId, pointsPerUnit, description, allowedVariancePercent }) {
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
    description: description || null,
    allowedVariancePercent: allowedVariancePercent !== undefined ? Number(allowedVariancePercent) : undefined
  })

  return {
    success: true,
    data: {
      reward_config_id: result.rewardConfigId,
      waste_type_id: result.wasteTypeId,
      points_per_unit: result.pointsPerUnit,
      description: result.description,
      allowed_variance_percent: result.allowedVariancePercent,
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
async function updateRewardConfig(rewardConfigId, { pointsPerUnit, description, allowedVariancePercent }) {
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

  if (allowedVariancePercent !== undefined) {
    const val = Number(allowedVariancePercent)
    if (isNaN(val) || val < 0) {
      throw new ApiError(400, 'allowedVariancePercent must be a non-negative integer')
    }
    updateData.allowedVariancePercent = val
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
      allowed_variance_percent: result.allowedVariancePercent,
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
    allowed_variance_percent: r.allowedVariancePercent,
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
      allowed_variance_percent: config.allowedVariancePercent,
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
      allowed_variance_percent: config.allowedVariancePercent,
      is_active: config.isActive === 1 || config.isActive === true,
      created_at: config.createdAt
    }
  }
}

module.exports = {
  // WasteType
  createWasteType,
  updateWasteType,
  toggleWasteTypeStatus,
  getAllWasteTypes,
  getWasteTypeById,
  deleteWasteType,

  // RewardConfig
  createRewardConfig,
  updateRewardConfig,
  getAllRewardConfigs,
  getRewardConfigById,
  getRewardConfigByWasteTypeId
}
