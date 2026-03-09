const wasteReportRepository = require('../repositories/wasteReportRepository')
const enterpriseReportRepository = require('../repositories/enterpriseReportRepository')
const ApiError = require('../errors/ApiError')
const { ROLES } = require('../utils/constants')
const userRepository = require('../repositories/userRepository')

/**
 * Xử lý logic doanh nghiệp chấp nhận báo cáo rác thải (ACCEPT)
 */
async function acceptReport(reportId, userAccountId) {
  // 1. Fetch the report
  const report = await wasteReportRepository.findReportById(reportId)
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.')
  }

  // 2. Check if the current_status is PENDING
  if (report.status !== 'PENDING') {
    throw new ApiError(
      400,
      `Report cannot be accepted. Current status is ${report.status || 'UNKNOWN'}. Expected PENDING.`
    )
  }

  // 3. Lookup report_status_type_id for ACCEPTED
  const statusTypeId = await enterpriseReportRepository.findStatusTypeIdByName('ACCEPTED')
  if (!statusTypeId) {
    throw new ApiError(500, 'Lỗi cấu hình hệ thống: Không tìm thấy trạng thái ACCEPTED trong database.')
  }

  // 4. Insert new record into ReportStatusHistory
  const { changedAt } = await enterpriseReportRepository.addReportStatusHistory(reportId, statusTypeId, userAccountId)

  // 5. Return response
  return {
    success: true,
    data: {
      reportId: report.wasteReportId,
      Status: 'ACCEPTED',
      acceptedAt: changedAt.toISOString()
    }
  }
}

/**
 * Xử lý logic doanh nghiệp từ chối báo cáo rác thải (REJECT)
 */
async function rejectReport(reportId, reason, userAccountId) {
  // 1. Validate reason is present (BR-40)
  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    throw new ApiError(400, 'Lý do từ chối (reason) là bắt buộc.')
  }

  // 2. Fetch the report
  const report = await wasteReportRepository.findReportById(reportId)
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.')
  }

  // 3. Check if the current_status is PENDING
  if (report.status !== 'PENDING') {
    throw new ApiError(400, 'Chỉ có thể từ chối báo cáo đang ở trạng thái PENDING.')
  }

  // 4. Fetch report_status_type_id for REJECTED
  const statusTypeId = await enterpriseReportRepository.findStatusTypeIdByName('REJECTED')
  if (!statusTypeId) {
    throw new ApiError(500, 'Lỗi cấu hình hệ thống: Không tìm thấy trạng thái REJECTED trong database.')
  }

  // 5. Insert new record into ReportStatusHistory
  await enterpriseReportRepository.addReportStatusHistory(reportId, statusTypeId, userAccountId)

  // Thêm lý do từ chối vào bảng Feedback
  await enterpriseReportRepository.addFeedback(reportId, report.citizenId, reason.trim())

  // 6. Return response
  return {
    success: true,
    data: {
      reportId: report.wasteReportId,
      status: 'REJECTED',
      reason: reason.trim()
    }
  }
}

/**
 * Xử lý logic doanh nghiệp assign báo cáo cho Collector (BE-4)
 */
async function assignReport(reportId, collectorUserAccountId, enterpriseUserAccountId) {
  // 1. Fetch the report
  const report = await wasteReportRepository.findReportById(reportId)
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.')
  }

  // 2. Report status must be ACCEPTED
  if (report.status !== 'ACCEPTED') {
    throw new ApiError(400, 'Chỉ có thể assign khi báo cáo đang ở trạng thái ACCEPTED.')
  }

  // 3. Fetch collector
  const collector = await userRepository.findById(collectorUserAccountId)
  if (!collector) {
    throw new ApiError(404, 'Không tìm thấy thông tin Collector.')
  }

  if (collector.roleId !== ROLES.COLLECTOR) {
    throw new ApiError(400, 'Người dùng này không phải là Collector.')
  }

  if (collector.isLocked) {
    throw new ApiError(400, 'Tài khoản Collector này đang bị khóa. (BR-29)')
  }

  // 4. Check collector overload (< 10 assignments)
  const assignCount = await enterpriseReportRepository.getCollectorAssignmentCount(collectorUserAccountId)
  if (assignCount >= 10) {
    throw new ApiError(400, `Collector đã đạt số lượng xử lý tối đa (${assignCount}/10 report).`)
  }

  // 5. Ensure report isn't already assigned
  const isAssigned = await enterpriseReportRepository.isReportAlreadyAssigned(reportId)
  if (isAssigned) {
    throw new ApiError(400, 'Báo cáo này đã được giao cho một Collector khác. (BR-41)')
  }

  // 6. Bind Collector to Report
  await enterpriseReportRepository.assignCollectorToReport(reportId, collectorUserAccountId)

  // 7. Update status history to ASSIGNED
  const statusTypeId = await enterpriseReportRepository.findStatusTypeIdByName('ASSIGNED')
  if (!statusTypeId) {
    throw new ApiError(500, 'Lỗi cấu hình hệ thống: Không tìm thấy trạng thái ASSIGNED.')
  }
  const { changedAt } = await enterpriseReportRepository.addReportStatusHistory(
    reportId,
    statusTypeId,
    enterpriseUserAccountId
  )

  // 8. Return spec struct
  return {
    success: true,
    data: {
      reportId: report.wasteReportId,
      collector: {
        id: collector.userAccountId,
        fullname: collector.fullname
      },
      status: 'ASSIGNED',
      assignedAt: changedAt.toISOString()
    }
  }
}

/**
 * Enterprise lấy tất cả báo cáo rác thải với phân trang & filter
 */
async function getAllReports({ status, fromDate, toDate, page, limit }) {
  const parsedPage = Math.max(1, Number(page) || 1)
  const parsedLimit = Math.max(1, Number(limit) || 10)
  const offset = (parsedPage - 1) * parsedLimit

  const { data, total } = await wasteReportRepository.findAllReports({
    status,
    fromDate,
    toDate,
    limit: parsedLimit,
    offset
  })

  return {
    success: true,
    data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total
    }
  }
}

/**
 * Enterprise lấy chi tiết 1 báo cáo theo reportId
 */
async function getReportById(reportId) {
  const report = await wasteReportRepository.findReportById(reportId)

  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.')
  }

  const attachments = Array.isArray(report?.attachments) ? report.attachments : []

  // Citizen images are sourced from reportattachment in wasteReportRepository.findReportById.
  // Normalize to a single response format for FE: { file_uri }.
  const citizenImagesSource = Array.isArray(report?.images)
    ? report.images
    : attachments.map((item) => ({ file_uri: item?.fileUri || item?.file_uri || null }))

  const citizenImages = citizenImagesSource
    .map((item) => ({
      file_uri: item?.file_uri || item?.fileUri || item?.url || null
    }))
    .filter((item) => Boolean(item.file_uri))

  return {
    success: true,
    data: {
      reportId: report.reportId || report.wasteReportId,
      wasteReportId: report.wasteReportId || report.reportId,
      wasteType: {
        id: report?.wasteType?.id ?? null,
        name: report?.wasteType?.name ?? null,
        unitType: report?.wasteType?.unitType ?? report?.unitType ?? null
      },
      citizen: {
        fullname: report?.citizen?.fullname ?? null,
        phone: report?.citizen?.phone ?? null
      },
      collector: report?.collector
        ? {
            userAccountId: report.collector.userAccountId,
            fullname: report.collector.fullname,
            phone: report.collector.phone
          }
        : null,
      location: {
        lat: report?.location?.lat ?? null,
        lng: report?.location?.lng ?? null
      },
      description: report?.description ?? null,
      weight: report?.weight ?? null,
      weightKg: report?.weightKg ?? report?.weight ?? null,
      actualQuantity: report?.actualQuantity ?? null,
      unitType: report?.unitType ?? report?.wasteType?.unitType ?? null,
      status: report?.status ?? null,
      createdAt: report?.createdAt ?? null,
      attachments,
      images: citizenImages,
      citizenImages,
      assignedCollector: report?.assignedCollector || null,
      collectorImages: Array.isArray(report?.collectorImages) ? report.collectorImages : [],
      collectedRecord: report?.collectedRecord || null,
      reason: report?.reason ?? null
    }
  }
}

module.exports = {
  acceptReport,
  rejectReport,
  assignReport,
  getAllReports,
  getReportById
}
