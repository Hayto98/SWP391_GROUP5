const voucherService = require('../../services/voucherService')

// ==================== VOUCHER CONTROLLERS ====================

/**
 * POST /enterprise/vouchers - Tạo Voucher mới
 */
async function createVoucher(req, res, next) {
  try {
    const payload = {
      ...req.body,
      fileBuffer: req.file?.buffer,
      fileMimetype: req.file?.mimetype
    }
    const result = await voucherService.createVoucher(payload)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createVoucher
}
