const voucherService = require('../../services/voucherService')

async function listAvailable(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const { page, limit } = req.query
    const result = await voucherService.getAvailableVouchers(userAccountId, { page, limit })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

async function redeem(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const { voucherId } = req.body
    const result = await voucherService.redeemVoucher(userAccountId, voucherId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = { listAvailable, redeem }
