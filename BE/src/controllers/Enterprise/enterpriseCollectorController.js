const enterpriseCollectorService = require('../../services/enterpriseCollectorService');

/**
 * Lấy danh sách Collector đang hoạt động và đáp ứng đủ điều kiện nhận việc.
 * GET /enterprise/collectors/available
 */
async function getAvailableCollectors(req, res, next) {
  try {
    const result = await enterpriseCollectorService.getAvailableCollectors();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAvailableCollectors
};
