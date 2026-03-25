const wasteReportService = require('../../services/wasteReportService')
const ApiError = require('../../errors/ApiError')

function getUserAccountIdFromRequest(req) {
  return req.user?.sub || req.user?.userAccountId || req.user?.id || null
}

/**
 * Tạo mới một báo cáo rác thải
 * POST /reports  — multipart/form-data
 */
async function createReport(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const { gpsLat, gpsLng, description, weight, fileUri } = req.body
    const files = req.files || []

    if (files.length > 5) {
      throw new ApiError(400, 'Bạn chỉ được phép tải lên tối đa 5 ảnh.')
    }

    const parsedWeight =
      weight !== undefined && weight !== null && String(weight).trim() !== '' ? parseFloat(weight) : null

    // Hỗ trợ items dạng JSON string (multipart) hoặc array (JSON body)
    let items = req.body.items
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch {
        throw new ApiError(400, 'items phải là một mảng JSON hợp lệ.')
      }
    }

    const report = await wasteReportService.createReport({
      userAccountId,
      items,
      gpsLat: parseFloat(gpsLat),
      gpsLng: parseFloat(gpsLng),
      description,
      weight: parsedWeight,
      files,
      fileUriFromBody: fileUri || null
    })

    // Tính weight = tổng quantity của tất cả items
    const totalWeight = (report.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)

    res.status(201).json({
      success: true,
      message: 'Tạo báo cáo rác thải thành công.',
      data: {
        reportId: report.reportId,
        reportCode: report.reportCode,
        items: report.items,
        description: report.description,
        gpsLat: report.gpsLat,
        gpsLng: report.gpsLng,
        weight: totalWeight,
        images: report.images || [],
        status: report.status,
        createdAt: report.createdAt,
        isSpam: report.isSpam,
        spamMessage: report.spamMessage,
        isDuplicate: report.isDuplicate,
        duplicateMessage: report.duplicateMessage
      }
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
    const userAccountId = getUserAccountIdFromRequest(req)
    if (!userAccountId) {
      throw new ApiError(401, 'Unauthorized')
    }
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
    const userAccountId = getUserAccountIdFromRequest(req)
    if (!userAccountId) {
      throw new ApiError(401, 'Unauthorized')
    }
    const reportId = req.params.id
    const roleId = req.user?.roleId || null

    const result = await wasteReportService.getReportById(reportId, userAccountId, roleId)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Cập nhật báo cáo rác thải
 * PUT /reports/:id — multipart/form-data hoặc JSON
 */
async function updateReport(req, res, next) {
  try {
    const userAccountId = getUserAccountIdFromRequest(req)
    if (!userAccountId) {
      throw new ApiError(401, 'Unauthorized')
    }
    const reportId = req.params.id
    const updateData = { ...req.body }

    // Hỗ trợ items dạng JSON string (multipart) hoặc array (JSON body)
    if (typeof updateData.items === 'string') {
      try {
        updateData.items = JSON.parse(updateData.items)
      } catch {
        throw new ApiError(400, 'items phải là một mảng JSON hợp lệ.')
      }
    }

    // Hỗ trợ file upload (multipart)
    const files = req.files || []
    if (files.length > 5) {
      throw new ApiError(400, 'Bạn chỉ được phép tải lên tối đa 5 ảnh.')
    }
    updateData.files = files

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
    const userAccountId = getUserAccountIdFromRequest(req)
    if (!userAccountId) {
      throw new ApiError(401, 'Unauthorized')
    }
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
