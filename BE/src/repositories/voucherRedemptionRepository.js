const db = require('../config/database')

// ==================== VOUCHER REDEMPTION QUERIES ====================

/**
 * Get aggregated voucher redemption statistics.
 * Only counts records with status = 'SUCCESS'.
 *
 * @returns {Promise<{ redeemedCount: number, totalPointsUsed: number }>}
 */
async function getVoucherStatistics() {
  const query = `
    SELECT 
      COUNT(*) AS redeemedCount,
      IFNULL(SUM(points_used), 0) AS totalPointsUsed
    FROM voucherredemption
    WHERE status = 'SUCCESS'
  `

  const [rows] = await db.execute(query)
  return {
    redeemedCount: Number(rows[0].redeemedCount),
    totalPointsUsed: Number(rows[0].totalPointsUsed)
  }
}

module.exports = {
  getVoucherStatistics
}
