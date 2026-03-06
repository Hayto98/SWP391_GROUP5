const enterpriseService = require('../../services/enterpriseService')

// ==================== WASTE TYPE CONTROLLERS ====================

/**
 * BE-5: POST /enterprise/waste-types - Tạo WasteType mới
 */
async function createWasteType(req, res, next) {
  try {
    const result = await enterpriseService.createWasteType(req.body)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /enterprise/waste-types - Lấy danh sách WasteType
 */
async function getAllWasteTypes(req, res, next) {
  try {
    const result = await enterpriseService.getAllWasteTypes(req.query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /enterprise/waste-types/:wasteTypeId - Lấy WasteType theo ID
 */
async function getWasteTypeById(req, res, next) {
  try {
    const result = await enterpriseService.getWasteTypeById(req.params.wasteTypeId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * BE-7: PUT /enterprise/waste-types/:wasteTypeId - Cập nhật WasteType
 */
async function updateWasteType(req, res, next) {
  try {
    const result = await enterpriseService.updateWasteType(req.params.wasteTypeId, req.body)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * BE-8: PATCH /enterprise/waste-types/:wasteTypeId/status - Toggle WasteType Active Status
 */
async function toggleWasteTypeStatus(req, res, next) {
  try {
    const wasteTypeId = Number(req.params.wasteTypeId)
    const { isActive } = req.body
    const result = await enterpriseService.toggleWasteTypeStatus(wasteTypeId, isActive)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * BE-12: DELETE /enterprise/waste-types/:wasteTypeId - Soft delete WasteType
 */
async function deleteWasteType(req, res, next) {
  try {
    const wasteTypeId = Number(req.params.wasteTypeId)
    const result = await enterpriseService.deleteWasteType(wasteTypeId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

// ==================== REWARD CONFIG CONTROLLERS ====================

/**
 * BE-6: POST /enterprise/reward-config - Tạo RewardConfig
 */
async function createRewardConfig(req, res, next) {
  try {
    // Accept both camelCase and snake_case input keys
    const payload = {
      wasteTypeId: req.body.wasteTypeId || req.body.waste_type_id,
      pointsPerUnit: req.body.pointsPerUnit || req.body.points_per_unit,
      description: req.body.description,
      allowedVariancePercent: req.body.allowedVariancePercent || req.body.allowed_variance_percent
    }

    const result = await enterpriseService.createRewardConfig(payload)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /enterprise/reward-config - Lấy danh sách RewardConfig
 */
async function getAllRewardConfigs(req, res, next) {
  try {
    const result = await enterpriseService.getAllRewardConfigs(req.query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /enterprise/reward-config/:rewardConfigId - Lấy RewardConfig theo ID
 */
async function getRewardConfigById(req, res, next) {
  try {
    const result = await enterpriseService.getRewardConfigById(req.params.rewardConfigId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /enterprise/reward-config/waste-type/:wasteTypeId - Lấy RewardConfig theo WasteType ID
 */
async function getRewardConfigByWasteTypeId(req, res, next) {
  try {
    const result = await enterpriseService.getRewardConfigByWasteTypeId(req.params.wasteTypeId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * BE-9: PUT /enterprise/reward-config/:rewardConfigId - Cập nhật RewardConfig
 */
async function updateRewardConfig(req, res, next) {
  try {
    const payload = {
      pointsPerUnit: req.body.pointsPerUnit || req.body.points_per_unit,
      description: req.body.description,
      allowedVariancePercent: req.body.allowedVariancePercent || req.body.allowed_variance_percent
    }

    const result = await enterpriseService.updateRewardConfig(req.params.rewardConfigId, payload)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  // WasteType
  createWasteType,
  getAllWasteTypes,
  getWasteTypeById,
  updateWasteType,
  toggleWasteTypeStatus,
  deleteWasteType,

  // RewardConfig
  createRewardConfig,
  getAllRewardConfigs,
  getRewardConfigById,
  getRewardConfigByWasteTypeId,
  updateRewardConfig
}
