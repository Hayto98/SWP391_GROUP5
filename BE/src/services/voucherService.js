const voucherRepository = require('../repositories/voucherRepository')
const userRepository = require('../repositories/userRepository')
const citizenRepository = require('../repositories/citizenRepository')
const collectorReportRepository = require('../repositories/collectorReportRepository')
const db = require('../config/database')
const ApiError = require('../errors/ApiError')
const { ROLES } = require('../utils/constants')
const { v4: uuidv4 } = require('uuid')
const cloudinary = require('../config/cloudinary')
const sharp = require('sharp')

async function getAvailableVouchers(userAccountId, { page, limit } = {}) {
  const user = await userRepository.findById(userAccountId)
  if (!user) throw new ApiError(404, 'Citizen not found')
  if (user.isLocked) throw new ApiError(403, 'Account is locked')
  if (user.roleId !== ROLES.CITIZEN) throw new ApiError(403, 'User is not a citizen')

  const citizen = await citizenRepository.findByUserAccountId(userAccountId)
  if (!citizen) throw new ApiError(404, 'Citizen record not found')

  const rows = await voucherRepository.findAvailable({ page, limit })

  const data = rows.map(r => ({
    voucherId: r.voucherId,
    voucherCode: r.voucherCode,
    title: r.title,
    pointsRequired: Number(r.pointsRequired) || 0,
    quantityRemaining: Number(r.quantityRemaining) || 0,
    fileUri: r.fileUri || null,
    canRedeem: (Number(citizen.totalPoints) || 0) >= (Number(r.pointsRequired) || 0)
  }))

  return { success: true, data }
}

/**
 * Redeem a voucher for a citizen. All DB updates happen inside a single transaction.
 */
async function redeemVoucher(userAccountId, voucherId) {
  if (!voucherId || typeof voucherId !== 'string') {
    throw new ApiError(400, 'voucherId is required')
  }

  const user = await userRepository.findById(userAccountId)
  if (!user) throw new ApiError(404, 'Citizen not found')
  if (user.isLocked) throw new ApiError(403, 'Account is locked')
  if (user.roleId !== ROLES.CITIZEN) throw new ApiError(403, 'User is not a citizen')

  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    const citizen = await citizenRepository.findByUserAccountIdForUpdate(connection, userAccountId)
    if (!citizen) throw new ApiError(404, 'Citizen record not found')

    const voucher = await voucherRepository.findByIdForUpdate(connection, voucherId)
    if (!voucher) throw new ApiError(404, 'Voucher not found')

    if (!voucher.isActive) throw new ApiError(400, 'Voucher is not active')
    const now = new Date()
    if (voucher.validFrom && new Date(voucher.validFrom) > now) throw new ApiError(400, 'Voucher not yet valid')
    if (voucher.validTo && new Date(voucher.validTo) < now) throw new ApiError(400, 'Voucher expired')
    if (Number(voucher.quantityRemaining) <= 0) throw new ApiError(400, 'Voucher out of stock')

    const pointsRequired = Number(voucher.pointsRequired) || 0
    const citizenPoints = Number(citizen.totalPoints) || 0
    if (citizenPoints < pointsRequired) throw new ApiError(400, 'Insufficient points')

    const redemptionId = uuidv4()
    const pointTransactionId = uuidv4()
    const nowDate = new Date()

    await voucherRepository.insertVoucherRedemption(connection, {
      redemptionId,
      voucherId,
      citizenId: citizen.citizenId,
      pointsUsed: pointsRequired,
      redeemedAt: nowDate
    })

    const affectedRows = await voucherRepository.decrementQuantity(connection, voucherId)
    if (affectedRows !== 1) {
      throw new ApiError(409, 'Voucher out of stock')
    }

    await collectorReportRepository.updateCitizenPoints(connection, citizen.citizenId, -pointsRequired)

    await collectorReportRepository.insertPointTransaction(connection, {
      pointTransactionId,
      citizenId: citizen.citizenId,
      wasteReportId: null,
      pointsDelta: -pointsRequired,
      transactionReason: `Redeem voucher ${voucher.voucherCode}`,
      createdAt: nowDate
    })

    await connection.commit()
    return {
      success: true,
      data: {
        voucherId,
        voucherCode: voucher.voucherCode,
        redemptionId,
        points: -pointsRequired
      }
    }
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

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

  const voucherData = {
    voucherId,
    voucherCode: formattedVoucherCode,
    title: title.trim(),
    description: description ? description.trim() : null,
    pointsRequired: Number(pointsRequired),
    quantityTotal: Number(quantityTotal),
    quantityRemaining: Number(quantityRemaining),
    validFrom,
    validTo,
    isActive,
    fileUri: imageUrl || fileUri || null,
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
    fileUri: imageUrl || fileUri || null,
    isActive: voucherData.isActive === 1
  }
}

module.exports = {
  getAvailableVouchers,
  redeemVoucher,
  createVoucher
}
