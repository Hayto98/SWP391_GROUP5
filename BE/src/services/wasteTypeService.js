const wasteTypeRepository = require('../repositories/wasteTypeRepository')
const ApiError = require('../errors/ApiError')

/**
 * Lấy danh sách loại rác active kèm cấu hình điểm thưởng
 */
async function getActiveWasteTypes() {
  const rows = await wasteTypeRepository.findActiveWithReward()

  const data = rows.map((row) => ({
    wasteTypeId: row.wasteTypeId,
    wasteTypeName: row.wasteTypeName,
    unitType: row.unitType,
    rewardConfigId: row.rewardConfigId ?? null,
    pointsPerUnit: row.pointsPerUnit,
    description: row.description || `${row.pointsPerUnit} điểm / 1 ${row.unitType}`,
    allowedVariancePercent:
      row.allowedVariancePercent !== null && row.allowedVariancePercent !== undefined
        ? Number(row.allowedVariancePercent)
        : null,
    penaltyPercent: row.penaltyPercent !== null && row.penaltyPercent !== undefined ? Number(row.penaltyPercent) : null,
    minKgRequired: row.minKgRequired !== null && row.minKgRequired !== undefined ? Number(row.minKgRequired) : null,
    maxKgRequired: row.maxKgRequired !== null && row.maxKgRequired !== undefined ? Number(row.maxKgRequired) : null,
    rewardConfigCreatedAt: row.rewardConfigCreatedAt || null,
    isActive: Boolean(row.isActive),
    rewardConfigActive: Boolean(row.rewardConfigActive)
  }))

  return { success: true, data }
}

async function getWasteTypeById(wasteTypeId) {
  const row = await wasteTypeRepository.findByIdWithReward(wasteTypeId)

  if (!row) {
    throw new ApiError(404, 'Waste type not found')
  }

  return {
    success: true,
    data: {
      wasteTypeId: row.wasteTypeId,
      wasteTypeName: row.wasteTypeName,
      unitType: row.unitType,
      isActive: Boolean(row.isActive),
      rewardConfig: row.rewardConfigId
        ? {
            rewardConfigId: row.rewardConfigId,
            pointsPerUnit: row.pointsPerUnit,
            description: row.description || `${row.pointsPerUnit} điểm / 1 ${row.unitType}`,
            allowedVariancePercent:
              row.allowedVariancePercent !== null && row.allowedVariancePercent !== undefined
                ? Number(row.allowedVariancePercent)
                : null,
            penaltyPercent:
              row.penaltyPercent !== null && row.penaltyPercent !== undefined ? Number(row.penaltyPercent) : null,
            minKgRequired:
              row.minKgRequired !== null && row.minKgRequired !== undefined ? Number(row.minKgRequired) : null,
            maxKgRequired:
              row.maxKgRequired !== null && row.maxKgRequired !== undefined ? Number(row.maxKgRequired) : null,
            createdAt: row.rewardConfigCreatedAt || null,
            isActive: Boolean(row.rewardConfigActive)
          }
        : null
    }
  }
}

module.exports = {
  getActiveWasteTypes,
  getWasteTypeById
}
