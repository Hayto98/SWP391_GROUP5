const wasteReportService = require('../../services/wasteReportService')

/**
 * Tạo mới một báo cáo rác thải
 * POST /reports  — multipart/form-data
 */
async function createReport(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const { wasteTypeId, gpsLat, gpsLng, description, weight } = req.body
    const fileBuffer = req.file ? req.file.buffer : null
    const fileMimetype = req.file ? req.file.mimetype : null

    const report = await wasteReportService.createReport({
      userAccountId,
      wasteTypeId,
      gpsLat: parseFloat(gpsLat),
      gpsLng: parseFloat(gpsLng),
      description,
      weight: weight ? parseFloat(weight) : null,
      fileBuffer,
      fileMimetype
    })

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy danh sách báo cáo rác của một User công dân (Citizen)
 * Theo yêu cầu SCRUM-14 GET /reports/my
 */
async function getMyReports(req, res, next) {
  try {
    // sub is the userAccountId decoded by verifyToken middleware
    const userAccountId = req.user.sub
    const queryParams = req.query

    const result = await wasteReportService.getMyReports(userAccountId, queryParams)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy chi tiết 1 báo cáo rác thải
 * Theo yêu cầu SCRUM-14 GET /reports/:id
 */
async function getReportById(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const reportId = req.params.id

    const result = await wasteReportService.getReportById(reportId, userAccountId)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Cập nhật báo cáo rác thải
 * Vui lòng chỉ truyền các properties (waste_type_id, description, gps_lat, gps_lng)
 * Yêu cầu SCRUM-14 (TASK 3) PUT /reports/:id
 */
async function updateReport(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const reportId = req.params.id
    const updateData = req.body

    const result = await wasteReportService.updateReport(reportId, userAccountId, updateData)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Xóa báo cáo rác thải
 * Chỉ xóa khi chủ (Citizen) yêu cầu và trạng thái là OPEN
 * Yêu cầu SCRUM-14 (TASK 4) DELETE /reports/:id
 */
async function deleteReport(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const reportId = req.params.id

    const result = await wasteReportService.deleteReport(reportId, userAccountId)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport
}
