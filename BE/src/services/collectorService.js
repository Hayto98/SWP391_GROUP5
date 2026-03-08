const userRepository = require('../repositories/userRepository')
const ApiError = require('../errors/ApiError')

/**
 * Cập nhật trạng thái làm việc (online/offline) của Collector
 * @param {string} collectorId - UUID của collector
 * @param {boolean} isWorking - Trạng thái làm việc
 * @returns {object} Thông báo thành công và trạng thái mới
 */
async function updateWorkingStatus(collectorId, isWorking) {
  // 1. Kiểm tra user có tồn tại không
  const user = await userRepository.findById(collectorId)
  if (!user) {
    throw new ApiError(404, 'Collector not found')
  }

  // 2. Nếu account is_locked = 1 -> return error
  if (user.isLocked === 1 || user.isLocked === true) {
    throw new ApiError(403, 'Account is locked. Cannot update working status.')
  }

  // 3. Convert boolean to 1 or 0 (implicitly done in repository, but we ensure it's boolean here)
  const statusToUpdate = isWorking === true || String(isWorking).toLowerCase() === 'true' || isWorking === 1

  // 4. Update working status
  await userRepository.updateWorkingStatus(collectorId, statusToUpdate)

  return {
    message: 'Working status updated successfully',
    isWorking: statusToUpdate
  }
}

module.exports = {
  updateWorkingStatus
}
