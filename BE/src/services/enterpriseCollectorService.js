const userRepository = require('../repositories/userRepository');

/**
 * Lấy danh sách Collector đang hoạt động (< 10 report ASSIGNED)
 */
async function getAvailableCollectors() {
  const collectors = await userRepository.findAvailableCollectors();
  
  // Format the output specifically as required: { userAccountId, fullname, phone, currentAssignedCount }
  const data = collectors.map(c => ({
    userAccountId: c.userAccountId,
    fullname: c.fullname,
    phone: String(c.phone),
    currentAssignedCount: Number(c.currentAssignedCount)
  }));

  return {
    success: true,
    data
  };
}

module.exports = {
  getAvailableCollectors
};
