const wasteReportRepository = require('../repositories/wasteReportRepository');
const enterpriseReportRepository = require('../repositories/enterpriseReportRepository');
const ApiError = require('../errors/ApiError');
const { ROLES } = require('../utils/constants');
const userRepository = require('../repositories/userRepository');

/**
 * Xử lý logic doanh nghiệp chấp nhận báo cáo rác thải (ACCEPT)
 */
async function acceptReport(reportId, userAccountId) {
  // 1. Fetch the report
  const report = await wasteReportRepository.findReportById(reportId);
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.');
  }

  // 2. Check if the current_status is PENDING
  if (report.status !== 'PENDING') {
    throw new ApiError(400, 'Report cannot be accepted. Status invalid or expired.');
  }

  // 3. Validate time: 4 hours (BR-5)
  const reportCreatedAt = new Date(report.createdAt);
  const now = new Date();
  const diffInHours = (now - reportCreatedAt) / (1000 * 60 * 60);

  if (diffInHours > 4) {
    throw new ApiError(400, 'Report cannot be accepted. Status invalid or expired.');
  }

  // 4. Lookup report_status_type_id for ACCEPTED
  const statusTypeId = await enterpriseReportRepository.findStatusTypeIdByName('ACCEPTED');
  if (!statusTypeId) {
    throw new ApiError(500, 'Lỗi cấu hình hệ thống: Không tìm thấy trạng thái ACCEPTED trong database.');
  }

  // 5. Insert new record into ReportStatusHistory
  const { changedAt } = await enterpriseReportRepository.addReportStatusHistory(reportId, statusTypeId, userAccountId);

  // 6. Return response
  return {
    success: true,
    data: {
      reportId: report.wasteReportId,
      Status: 'ACCEPTED',
      acceptedAt: changedAt.toISOString()
    }
  };
}

/**
 * Xử lý logic doanh nghiệp từ chối báo cáo rác thải (REJECT)
 */
async function rejectReport(reportId, reason, userAccountId) {
  // 1. Validate reason is present (BR-40)
  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    throw new ApiError(400, 'Lý do từ chối (reason) là bắt buộc.');
  }

  // 2. Fetch the report
  const report = await wasteReportRepository.findReportById(reportId);
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.');
  }

  // 3. Check if the current_status is PENDING
  if (report.status !== 'PENDING') {
    throw new ApiError(400, 'Chỉ có thể từ chối báo cáo đang ở trạng thái PENDING.');
  }

  // 4. Fetch report_status_type_id for REJECTED
  const statusTypeId = await enterpriseReportRepository.findStatusTypeIdByName('REJECTED');
  if (!statusTypeId) {
    throw new ApiError(500, 'Lỗi cấu hình hệ thống: Không tìm thấy trạng thái REJECTED trong database.');
  }

  // 5. Insert new record into ReportStatusHistory
  await enterpriseReportRepository.addReportStatusHistory(reportId, statusTypeId, userAccountId);

  // Thêm lý do từ chối vào bảng Feedback
  await enterpriseReportRepository.addFeedback(reportId, report.citizenId, reason.trim());


// 6. Return response
  return {
    success: true,
    data: {
      reportId: report.wasteReportId,
      status: 'REJECTED',
      reason: reason.trim()
    }
  };
}

/**
 * Xử lý logic doanh nghiệp assign báo cáo cho Collector (BE-4)
 */
async function assignReport(reportId, collectorUserAccountId, enterpriseUserAccountId) {
  // 1. Fetch the report
  const report = await wasteReportRepository.findReportById(reportId);
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.');
  }

  // 2. Report status must be ACCEPTED
  if (report.status !== 'ACCEPTED') {
    throw new ApiError(400, 'Chỉ có thể assign khi báo cáo đang ở trạng thái ACCEPTED.');
  }

  // 3. Fetch collector
  const collector = await userRepository.findById(collectorUserAccountId);
  if (!collector) {
    throw new ApiError(404, 'Không tìm thấy thông tin Collector.');
  }
  
  if (collector.roleId !== ROLES.COLLECTOR) {
    throw new ApiError(400, 'Người dùng này không phải là Collector.');
  }

  if (collector.isLocked) {
    throw new ApiError(400, 'Tài khoản Collector này đang bị khóa. (BR-29)');
  }

  // 4. Check collector overload (< 10 assignments)
  const assignCount = await enterpriseReportRepository.getCollectorAssignmentCount(collectorUserAccountId);
  if (assignCount >= 10) {
    throw new ApiError(400, `Collector đã đạt số lượng xử lý tối đa (${assignCount}/10 report).`);
  }

  // 5. Ensure report isn't already assigned
  const isAssigned = await enterpriseReportRepository.isReportAlreadyAssigned(reportId);
  if (isAssigned) {
    throw new ApiError(400, 'Báo cáo này đã được giao cho một Collector khác. (BR-41)');
  }

  // 6. Bind Collector to Report
  await enterpriseReportRepository.assignCollectorToReport(reportId, collectorUserAccountId);

  // 7. Update status history to ASSIGNED
  const statusTypeId = await enterpriseReportRepository.findStatusTypeIdByName('ASSIGNED');
  if (!statusTypeId) {
    throw new ApiError(500, 'Lỗi cấu hình hệ thống: Không tìm thấy trạng thái ASSIGNED.');
  }
  const { changedAt } = await enterpriseReportRepository.addReportStatusHistory(reportId, statusTypeId, enterpriseUserAccountId);

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
  };
}

module.exports = {
  acceptReport,
  rejectReport,
  assignReport
};
