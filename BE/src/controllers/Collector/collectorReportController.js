const collectorReportService = require('../../services/collectorReportService')

/**
 * GET /collector/reports
 * Returns waste reports assigned to the authenticated collector (ASSIGNED + IN_PROGRESS + COLLECTED).
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

/**
 * GET /collector/reports/:reportId
 * Returns detail of a single report for the authenticated collector.
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

/**
 * POST /collector/reports/:reportId/result
 * Collector submits actual quantity result — compares against estimated weight.
 * Body: multipart/form-data OR application/json  { actualQuantity, note, quantity_unit, file }
 */
async function submitResult(req, res, next) {
  try {
    const collectorId = req.user.sub
    const { reportId } = req.params
    const { actualQuantity, note, quantity_unit, file } = req.body
    const attachedFile = req.file

    const result = await collectorReportService.submitResult(
      collectorId,
      reportId,
      { actualQuantity, note, quantity_unit, file_uri: file },
      attachedFile
    )

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /collector/reports/:reportId/complete
 * Collector completes the collection — uploads proof images, records results, marks COLLECTED.
 * Body: multipart/form-data  { actualQuantity, quantityUnit, note, files[] }
 */
async function completeReport(req, res, next) {
  try {
    const collectorId = req.user.sub
    const { reportId } = req.params

    const { actualQuantity, quantityUnit, note } = req.body || {}
    const files = req.files || []

    const result = await collectorReportService.completeReport(
      collectorId,
      reportId,
      { actualQuantity, quantityUnit, note },
      files
    )

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /collector/reports/:reportId/result
 * Returns the collection record and proof images for a completed report.
 */
async function getResult(req, res, next) {
  try {
    const collectorId = req.user.sub
    const { reportId } = req.params

    const result = await collectorReportService.getCollectionResult(collectorId, reportId)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /collector/reports/:reportId/schedule
 * Collector sets the scheduled collection time for a waste report.
 */
async function scheduleCollection(req, res, next) {
  try {
    const collectorId = req.user.sub
    const { reportId } = req.params
    const { scheduledCollectAt } = req.body

    const result = await collectorReportService.scheduleCollection(collectorId, reportId, scheduledCollectAt)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAssignedReports,
  getReportById,
  acceptReport,
  submitResult,
  completeReport,
  getResult,
  scheduleCollection
}
