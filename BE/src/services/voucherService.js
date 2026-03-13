const voucherRepository = require('../repositories/voucherRepository')
const userRepository = require('../repositories/userRepository')
const citizenRepository = require('../repositories/citizenRepository')
const collectorReportRepository = require('../repositories/collectorReportRepository')
const db = require('../config/database')
const ApiError = require('../errors/ApiError')
const { ROLES } = require('../utils/constants')
const { v4: uuidv4 } = require('uuid')

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
  const user = await userRepository.findById(userAccountId)
  if (!user) throw new ApiError(404, 'Citizen not found')
  if (user.isLocked) throw new ApiError(403, 'Account is locked')
  if (user.roleId !== ROLES.CITIZEN) throw new ApiError(403, 'User is not a citizen')

  const citizen = await citizenRepository.findByUserAccountId(userAccountId)
  if (!citizen) throw new ApiError(404, 'Citizen record not found')

  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

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

    // Perform DB updates
    const redemptionId = uuidv4()
    const pointTransactionId = uuidv4()
    const nowDate = new Date()

    await voucherRepository.insertVoucherRedemption(connection, {
      redemptionId,
      voucherId,
      citizenId: citizen.citizenId,
      createdAt: nowDate
    })

    await voucherRepository.decrementQuantity(connection, voucherId)

    // subtract points from citizen (pointsDelta is negative)
    await collectorReportRepository.updateCitizenPoints(connection, citizen.citizenId, -pointsRequired)

    // insert point transaction
    await collectorReportRepository.insertPointTransaction(connection, {
      pointTransactionId,
      citizenId: citizen.citizenId,
      wasteReportId: null,
      pointsDelta: -pointsRequired,
      transactionReason: 'REDEEM_VOUCHER',
      createdAt: nowDate
    })

    await connection.commit()
    return { success: true, data: { voucherId, redemptionId } }
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

module.exports = { getAvailableVouchers, redeemVoucher }
