const userRepository = require('../repositories/userRepository')
const ApiError = require('../errors/ApiError')

/**
 * Cập nhật trạng thái làm việc (online/offline) của Collector
 */
async function updateWorkingStatus(collectorId, isWorking) {
  const user = await userRepository.findById(collectorId)
  if (!user) {
    throw new ApiError(404, 'Collector not found')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Account is locked')
  }

  const statusToUpdate = isWorking === true || String(isWorking).toLowerCase() === 'true' || isWorking === 1

  await userRepository.updateWorkingStatus(collectorId, statusToUpdate)

  return {
    message: 'Working status updated successfully',
    isWorking: statusToUpdate
  }
}

module.exports = {
  updateWorkingStatus
}
