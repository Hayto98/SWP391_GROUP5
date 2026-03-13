const voucherRepository = require('../repositories/voucherRepository')
const userRepository = require('../repositories/userRepository')
const citizenRepository = require('../repositories/citizenRepository')
const ApiError = require('../errors/ApiError')
const { ROLES } = require('../utils/constants')

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

module.exports = { getAvailableVouchers }
