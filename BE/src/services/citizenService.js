const citizenRepository = require('../repositories/citizenRepository')
const userRepository = require('../repositories/userRepository')
const ApiError = require('../errors/ApiError')
const { ROLES } = require('../utils/constants')

async function getMyPoints(userAccountId) {
  const user = await userRepository.findById(userAccountId)
  if (!user) {
    throw new ApiError(404, 'Citizen not found')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Account is locked')
  }

  if (user.roleId !== ROLES.CITIZEN) {
    throw new ApiError(403, 'User is not a citizen')
  }

  const citizen = await citizenRepository.findByUserAccountId(userAccountId)
  if (!citizen) {
    throw new ApiError(404, 'Citizen record not found')
  }

  return {
    success: true,
    data: {
      citizenId: citizen.citizenId,
      totalPoints: Number(citizen.totalPoints) || 0
    }
  }
}

async function getPointHistory(userAccountId, { fromDate, toDate, type, page, limit } = {}) {
  const user = await userRepository.findById(userAccountId)
  if (!user) {
    throw new ApiError(404, 'Citizen not found')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Account is locked')
  }

  if (user.roleId !== ROLES.CITIZEN) {
    throw new ApiError(403, 'User is not a citizen')
  }

  const citizen = await citizenRepository.findByUserAccountId(userAccountId)
  if (!citizen) {
    throw new ApiError(404, 'Citizen record not found')
  }

  // sanitize pagination
  const p = Math.max(1, Number(page) || 1)
  const l = Math.max(1, Math.min(100, Number(limit) || 20))

  const rows = await citizenRepository.findPointTransactions(citizen.citizenId, {
    fromDate,
    toDate,
    type,
    page: p,
    limit: l
  })

  return {
    success: true,
    data: rows.map(r => ({
      transactionId: r.transactionId,
      type: r.type,
      points: Number(r.points),
      reason: r.reason,
      createdAt: r.createdAt
    }))
  }
}

module.exports = { getMyPoints, getPointHistory }
