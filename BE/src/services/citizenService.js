const citizenRepository = require('../repositories/citizenRepository')
const userRepository = require('../repositories/userRepository')
const ApiError = require('../errors/ApiError')
const { ROLES } = require('../utils/constants')

function toMySqlDateTime(value, { endOfDay = false, fieldName = 'date' } = {}) {
  if (!value) return undefined

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value} ${endOfDay ? '23:59:59' : '00:00:00'}`
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `Invalid ${fieldName}`)
  }

  return parsed.toISOString().slice(0, 19).replace('T', ' ')
}

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

  const normalizedType = typeof type === 'string' && type.trim() ? type.trim().toUpperCase() : undefined
  if (normalizedType && normalizedType !== 'EARN' && normalizedType !== 'REDEEM') {
    throw new ApiError(400, 'type must be EARN or REDEEM')
  }

  const normalizedFromDate = toMySqlDateTime(fromDate, { fieldName: 'fromDate' })
  const normalizedToDate = toMySqlDateTime(toDate, { endOfDay: true, fieldName: 'toDate' })

  if (normalizedFromDate && normalizedToDate && normalizedFromDate > normalizedToDate) {
    throw new ApiError(400, 'fromDate must be before or equal to toDate')
  }

  const p = Math.max(1, Number(page) || 1)
  const l = Math.max(1, Math.min(100, Number(limit) || 20))

  const rows = await citizenRepository.findPointTransactions(citizen.citizenId, {
    fromDate: normalizedFromDate,
    toDate: normalizedToDate,
    type: normalizedType,
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
