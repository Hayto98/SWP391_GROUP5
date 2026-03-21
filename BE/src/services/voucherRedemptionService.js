const voucherRedemptionRepository = require('../repositories/voucherRedemptionRepository')

// ==================== VOUCHER REDEMPTION SERVICES ====================

/**
 * Get voucher redemption statistics for Enterprise dashboard.
 *
 * @returns {Promise<{ redeemedCount: number, totalPointsUsed: number }>}
 */
async function getVoucherStatistics() {
  const statistics = await voucherRedemptionRepository.getVoucherStatistics()
  return statistics
}

module.exports = {
  getVoucherStatistics
}
