const userRepository = require('../repositories/userRepository')

/**
 * Lấy danh sách Collector đang làm việc (is_working = 1, is_locked = 0)
 */
async function getAvailableCollectors() {
  const collectors = await userRepository.getWorkingCollectors()

  if (collectors.length === 0) {
    return {
      collectors: [],
      message: 'No collectors currently available'
    }
  }

  return {
    collectors
  }
}

module.exports = {
  getAvailableCollectors
}
