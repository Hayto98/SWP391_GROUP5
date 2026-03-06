const enterpriseReportService = require('../../services/enterpriseReportService');
const ApiError = require('../../errors/ApiError');

function getUserAccountIdFromRequest(req) {
  return req.user?.sub || req.user?.userAccountId || req.user?.id || null;
}

/**
 * Doanh nghiệp Accept báo cáo
 * POST /enterprise/reports/:reportId/accept
 */
async function acceptReport(req, res, next) {
  try {
    const userAccountId = getUserAccountIdFromRequest(req);
    if (!userAccountId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const reportId = req.params.reportId;

    const result = await enterpriseReportService.acceptReport(reportId, userAccountId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Doanh nghiệp Reject báo cáo
 * POST /enterprise/reports/:reportId/reject
 */
async function rejectReport(req, res, next) {
  try {
    const userAccountId = getUserAccountIdFromRequest(req);
    if (!userAccountId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const reportId = req.params.reportId;
    const { reason } = req.body;

    const result = await enterpriseReportService.rejectReport(reportId, reason, userAccountId);

    res.status(200).json(result);
} catch (error) {
    next(error);
  }
}

/**
 * Doanh nghiệp Assign báo cáo cho Collector
 * POST /enterprise/reports/:reportId/assign
 */
async function assignReport(req, res, next) {
  try {
    const userAccountId = getUserAccountIdFromRequest(req);
    if (!userAccountId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const reportId = req.params.reportId;
    const { collectorUserAccountId } = req.body;

    if (!collectorUserAccountId) {
      throw new ApiError(400, 'Missing collectorUserAccountId in request body.');
    }

    const result = await enterpriseReportService.assignReport(reportId, collectorUserAccountId, userAccountId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  acceptReport,
  rejectReport,
  assignReport
};
