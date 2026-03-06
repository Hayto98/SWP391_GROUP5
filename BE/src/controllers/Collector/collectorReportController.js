const collectorReportService = require('../../services/collectorReportService')

/**
 * GET /collector/reports
 * Returns waste reports assigned to the authenticated collector.
 */
async function getAssignedReports(req, res, next) {
  try {
    const userId = req.user.sub
    const queryParams = req.query

    const result = await collectorReportService.getAssignedReports(userId, queryParams)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAssignedReports,
  getReportById,
  acceptReport
}

/**
 * GET /collector/reports/:reportId
 * Returns detail of a single assigned report for the authenticated collector.
 */
async function getReportById(req, res, next) {
  try {
    const userId = req.user.sub
    const reportId = req.params.reportId

    const result = await collectorReportService.getReportById(userId, reportId)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /collector/reports/:reportId/accept
 * Collector accepts an ASSIGNED report → transitions to IN_PROGRESS.
 */
async function acceptReport(req, res, next) {
  try {
    const collectorId = req.user.sub
    const { reportId } = req.params

    const result = await collectorReportService.acceptAssignedReport(collectorId, reportId)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
