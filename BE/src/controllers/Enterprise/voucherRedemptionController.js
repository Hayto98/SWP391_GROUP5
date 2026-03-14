const voucherRedemptionService = require('../../services/voucherRedemptionService')

// ==================== VOUCHER REDEMPTION CONTROLLERS ====================

/**
 * GET /enterprise/vouchers/statistics - Voucher redemption statistics
 */
async function getVoucherStatistics(req, res, next) {
  try {
    const statistics = await voucherRedemptionService.getVoucherStatistics()
    res.status(200).json({
      success: true,
      statistics
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getVoucherStatistics
}
