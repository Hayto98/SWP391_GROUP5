const db = require('../config/database')

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

module.exports = {
  findActiveWithReward
}
