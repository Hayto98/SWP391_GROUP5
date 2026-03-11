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
    pointsPerUnit: row.pointsPerUnit,
    description: row.description || `${row.pointsPerUnit} điểm / 1 ${row.unitType}`,
    isActive: Boolean(row.isActive)
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
