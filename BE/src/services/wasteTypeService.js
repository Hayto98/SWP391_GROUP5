const wasteTypeRepository = require('../repositories/wasteTypeRepository')

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

module.exports = {
  getActiveWasteTypes
}
