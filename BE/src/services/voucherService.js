const { v4: uuidv4 } = require('uuid')
const voucherRepository = require('../repositories/voucherRepository')
const ApiError = require('../errors/ApiError')
const cloudinary = require('../config/cloudinary')
const sharp = require('sharp')

// ==================== HELPERS ====================

/**
 * Compress an image Buffer using sharp before upload.
 * Resizes to max 1200px width, converts to JPEG, quality 80%.
 * Non-image files are passed through unchanged.
 * @private
 */
async function compressImage(buffer, mimetype) {
  if (!mimetype || !mimetype.startsWith('image/')) return buffer
  try {
    return await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
  } catch {
    return buffer
  }
}

/**
 * Upload a Buffer to Cloudinary and return the secure_url.
 */
async function uploadBufferToCloudinary(buffer, mimetype) {
  const compressed = await compressImage(buffer, mimetype)
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vouchers', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(new ApiError(500, 'Cloudinary upload failed: ' + error.message))
        resolve(result.secure_url)
      }
    )
    stream.end(compressed)
  })
}

// ==================== VOUCHER SERVICES ====================

/**
 * BE: Tạo Voucher mới
 * POST /enterprise/vouchers
 */
async function createVoucher(payload) {
  const {
    voucherCode,
    title,
    description,
    pointsRequired,
    quantityTotal,
    validFrom,
    validTo,
    fileUri,
    fileBuffer,
    fileMimetype
  } = payload

  // 1. Validate required fields
  if (!voucherCode || !voucherCode.trim()) {
    throw new ApiError(400, 'voucherCode is required')
  }
  if (!title || !title.trim()) {
    throw new ApiError(400, 'title is required')
  }
  if (pointsRequired === undefined || pointsRequired === null || pointsRequired < 0) {
    throw new ApiError(400, 'pointsRequired is required and must be >= 0')
  }
  if (quantityTotal === undefined || quantityTotal === null || quantityTotal <= 0) {
    throw new ApiError(400, 'quantityTotal is required and must be > 0')
  }
  if (!validFrom) {
    throw new ApiError(400, 'validFrom is required')
  }
  if (!validTo) {
    throw new ApiError(400, 'validTo is required')
  }

  // Basic date validation
  if (new Date(validFrom) >= new Date(validTo)) {
    throw new ApiError(400, 'validTo must be strictly after validFrom')
  }

  // 2. Check for duplicate voucher code
  const existingVoucher = await voucherRepository.findByVoucherCode(voucherCode.trim())
  if (existingVoucher) {
    throw new ApiError(409, 'Voucher with this code already exists')
  }

  // 3. Handle file upload (if any)
  let imageUrl = null
  if (fileBuffer) {
    imageUrl = await uploadBufferToCloudinary(fileBuffer, fileMimetype || 'image/jpeg')
  } else if (fileUri) {
    imageUrl = fileUri
  }

  // 4. Prepare data for insertion
  const voucherId = uuidv4()
  const createdAt = new Date()
  
  const formattedVoucherCode = voucherCode.trim()
  const quantityRemaining = quantityTotal // Default to total
  const isActive = 1 // Default to active true/1

  const finalDescription = description ? description.trim() : null

  const voucherData = {
    voucherId,
    voucherCode: formattedVoucherCode,
    title: title.trim(),
    description: finalDescription,
    pointsRequired: Number(pointsRequired),
    quantityTotal: Number(quantityTotal),
    quantityRemaining: Number(quantityRemaining),
    validFrom,
    validTo,
    fileUri: imageUrl || null,
    isActive, 
    createdAt
  }

  await voucherRepository.insertVoucher(voucherData)

  // 5. Transform response format
  return {
    voucherCode: voucherData.voucherCode,
    title: voucherData.title,
    description: voucherData.description || '',
    pointsRequired: voucherData.pointsRequired,
    quantityTotal: voucherData.quantityTotal,
    quantityRemaining: voucherData.quantityRemaining,
    validFrom: voucherData.validFrom,
    validTo: voucherData.validTo,
    fileUri: voucherData.fileUri,
    isActive: voucherData.isActive === 1
  }
}

/**
 * BE: Cập nhật Voucher
 * PUT /enterprise/vouchers/:voucherId
 */
async function updateVoucher(voucherId, payload) {
  const {
    title,
    description,
    pointsRequired,
    points_required,
    quantityTotal,
    quantity_total,
    validFrom,
    valid_from,
    validTo,
    valid_to,
    isActive,
    is_active,
    fileUri,
    file_uri,
    fileBuffer,
    fileMimetype
  } = payload

  // 1. Check if voucher exists
  const existingVoucher = await voucherRepository.findById(voucherId)
  if (!existingVoucher) {
    throw new ApiError(404, 'Voucher không tồn tại')
  }

  // 2. Validate and build update data
  const updateData = {}

  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, 'title không được để trống')
    updateData.title = title.trim()
  }

  // 3. Handle file upload combined with description mapping
  let imageUrl = undefined
  if (fileBuffer) {
    imageUrl = await uploadBufferToCloudinary(fileBuffer, fileMimetype || 'image/jpeg')
  } else if (file_uri !== undefined) {
    imageUrl = file_uri
  }

  if (description !== undefined) {
    updateData.description = description.trim() ? description.trim() : null
  }
  
  if (imageUrl !== undefined) {
    updateData.file_uri = imageUrl
  }

  if (pointsRequired !== undefined || points_required !== undefined) {
    const pReq = pointsRequired ?? points_required
    const points = Number(pReq)
    if (isNaN(points) || points < 0) throw new ApiError(400, 'points_required phải >= 0')
    updateData.points_required = points
  }

  if (quantityTotal !== undefined || quantity_total !== undefined) {
    const qTot = quantityTotal ?? quantity_total
    const qtyTotal = Number(qTot)
    if (isNaN(qtyTotal) || qtyTotal <= 0) throw new ApiError(400, 'quantity_total phải > 0')

    const oldTotal = existingVoucher.quantity_total
    const oldRemaining = existingVoucher.quantity_remaining
    const updatedRemaining = oldRemaining + (qtyTotal - oldTotal)
    
    if (updatedRemaining < 0) {
      throw new ApiError(400, 'Tống số lượng mới sẽ thấp hơn số voucher đã được người dùng đổi')
    }

    updateData.quantity_total = qtyTotal
    updateData.quantity_remaining = updatedRemaining
  }

  const finalValidFrom = validFrom ?? valid_from
  if (finalValidFrom !== undefined) {
    updateData.valid_from = finalValidFrom
  }

  const finalValidTo = validTo ?? valid_to
  if (finalValidTo !== undefined) {
    updateData.valid_to = finalValidTo
  }

  // Validate dates if both or either are updated
  const newValidFrom = updateData.valid_from || existingVoucher.valid_from
  const newValidTo = updateData.valid_to || existingVoucher.valid_to
  if (new Date(newValidFrom) >= new Date(newValidTo)) {
    throw new ApiError(400, 'valid_to test phái sau valid_from')
  }

  const finalIsActive = isActive ?? is_active
  if (finalIsActive !== undefined) {
    // accept boolean or 1/0 string
    updateData.is_active = (finalIsActive === true || finalIsActive === 'true' || finalIsActive === 1 || finalIsActive === '1') ? 1 : 0
  }

  // 4. Update
  await voucherRepository.updateVoucher(voucherId, updateData)

  // 5. Fetch updated
  const updatedVoucher = await voucherRepository.findById(voucherId)

  return {
    voucherId: updatedVoucher.voucher_id,
    voucherCode: updatedVoucher.voucher_code,
    title: updatedVoucher.title,
    description: updatedVoucher.description || '',
    pointsRequired: updatedVoucher.points_required,
    quantityTotal: updatedVoucher.quantity_total,
    quantityRemaining: updatedVoucher.quantity_remaining,
    validFrom: updatedVoucher.valid_from,
    validTo: updatedVoucher.valid_to,
    fileUri: imageUrl || undefined, 
    isActive: updatedVoucher.is_active === 1
  }
}

/**
 * BE: Xóa (Soft delete) Voucher
 * DELETE /enterprise/vouchers/:voucherId
 */
async function deleteVoucher(voucherId) {
  // 1. Check if voucher exists
  const existingVoucher = await voucherRepository.findById(voucherId)
  if (!existingVoucher) {
    throw new ApiError(404, 'Voucher không tồn tại')
  }

  // 2. Perform soft delete
  await voucherRepository.updateVoucher(voucherId, { is_active: 0 })

  return {
    success: true,
    message: 'Đã xóa voucher thành công'
  }
}

/**
 * BE: Lấy danh sách Voucher
 * GET /enterprise/vouchers
 */
async function getVouchers(queryParams) {
  const page = Math.max(1, Number(queryParams.page) || 1)
  const limit = Math.max(1, Number(queryParams.limit) || 10)
  const offset = (page - 1) * limit

  const { data, total } = await voucherRepository.getVouchers({ limit, offset })

  // Transform fields as per requirements
  const formattedData = data.map((v) => {

    return {
      voucherCode: v.voucher_code,
      title: v.title,
      description: v.description || '', // Return cleaned description
      fileUri: v.file_uri || null,      // Directly use file_uri
      pointsRequired: v.points_required,
      quantityTotal: v.quantity_total,
      quantityRemaining: v.quantity_remaining,
      redeemedCount: v.quantity_total - v.quantity_remaining
    }
  })

  return {
    success: true,
    data: formattedData,
    pagination: {
      page,
      limit,
      total
    }
  }
}

/**
 * BE: Lấy chi tiết một Voucher theo ID
 * GET /enterprise/vouchers/:voucherId
 */
async function getVoucherById(voucherId, userRole) {
  const { ROLES } = require('../utils/constants')
  // Check if role is Enterprise (can be roleId or role name string depending on auth setup)
  if (userRole !== ROLES.ENTERPRISE && userRole !== 'ENTERPRISE') {
    throw new ApiError(403, 'Bạn không có quyền truy cập voucher này. Chỉ dành cho Enterprise.')
  }

  const voucher = await voucherRepository.getVoucherByIdWithRedemptionCount(voucherId)
  if (!voucher) {
    throw new ApiError(404, 'Voucher không tồn tại')
  }

  // 1. Determine status
  let status = 'ACTIVE'
  if (voucher.is_active === 0) {
    status = 'INACTIVE'
  } else if (voucher.valid_to && new Date(voucher.valid_to) < new Date()) {
    status = 'EXPIRED'
  } else if (voucher.quantity_remaining === 0) {
    status = 'SOLD_OUT'
  }

  // 3. Map to specific return format
  return {
    success: true,
    data: {
      voucherId: voucher.voucher_id,
      voucherCode: voucher.voucher_code,
      title: voucher.title,
      description: voucher.description || '',
      pointsRequired: voucher.points_required,
      fileUri: voucher.file_uri || null,
      status,
      expiryDate: voucher.valid_to,
      redeemedCount: Number(voucher.redeemed_count) || 0,
      createdAt: voucher.created_at
    }
  }
}

module.exports = {
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getVouchers,
  getVoucherById
}
