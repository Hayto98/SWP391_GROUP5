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

module.exports = { getMyPoints }
