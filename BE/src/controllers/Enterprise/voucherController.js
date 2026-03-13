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

/**
 * PUT /enterprise/vouchers/:voucherId - Cập nhật Voucher
 */
async function updateVoucher(req, res, next) {
  try {
    const payload = {
      ...req.body,
      fileBuffer: req.file?.buffer,
      fileMimetype: req.file?.mimetype
    }
    const result = await voucherService.updateVoucher(req.params.voucherId, payload)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createVoucher,
  updateVoucher
}
