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

/**
 * DELETE /enterprise/vouchers/:voucherId - Xóa Voucher (Soft Delete)
 */
async function deleteVoucher(req, res, next) {
  try {
    const result = await voucherService.deleteVoucher(req.params.voucherId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /enterprise/vouchers - Danh sách Voucher
 */
async function getVouchers(req, res, next) {
  try {
    const result = await voucherService.getVouchers(req.query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getVouchers
}
