const complaintRepository = require('../repositories/complaintRepository')
const wasteReportRepository = require('../repositories/wasteReportRepository')
const ApiError = require('../errors/ApiError')

async function createComplaint({ userAccountId, wasteReportId, complaintReason, attachments }) {
  if (!userAccountId || !wasteReportId) {
    throw new ApiError(400, 'Thiếu userAccountId hoặc wasteReportId.')
  }

  // Lấy citizenId từ userAccountId
  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
     throw new ApiError(403, 'Người dùng không phải là Citizen hoặc chưa được thiết lập tài khoản Citizen.')
  }

  // Validate wasteReportId tồn tại trong wasteReport
  // (Sử dụng existing findById query or similar logic)
  const report = await wasteReportRepository.findReportById(wasteReportId)
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải (WasteReport).')
  }

  // Chỉ cho phép khiếu nại nếu trạng thái là ASSIGNED, IN_PROGRESS hoặc COLLECTED
  if (report.status !== 'ASSIGNED' && report.status !== 'IN_PROGRESS' && report.status !== 'COLLECTED') {
    throw new ApiError(400, 'Chỉ có thể khiếu nại rác thải ở trạng thái Đã được phân công (ASSIGNED), Đang thu gom (IN_PROGRESS) hoặc Đã thu gom (COLLECTED).')
  }
  
  // Xác thực citizen chỉ được tạo 1 complaint cho 1 report
  const existingComplaint = await complaintRepository.findComplaintByCitizenAndReport(citizenId, wasteReportId)
  if (existingComplaint) {
    throw new ApiError(409, 'Bạn đã gửi khiếu nại cho báo cáo rác thải này rồi.')
  }

  // Insert vào bảng
  const reportComplaintId = await complaintRepository.createComplaint({
    wasteReportId,
    citizenId,
    complaintReason,
    attachments
  })

  // Trả về dữ liệu như JIRA yêu cầu
  return {
    reportComplaintId,
    wasteReportId,
    complaintStatus: 'OPEN',
    refundPoints: 0,
    createdAt: new Date()
  }
}

async function getMyComplaints({ userAccountId, query }) {
  if (!userAccountId) {
    throw new ApiError(400, 'Thiếu userAccountId.')
  }

  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(403, 'Người dùng không phải là Citizen.')
  }

  const { status, page = 1, limit = 10 } = query

  const parsedPage = Math.max(1, parseInt(page, 10) || 1)
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10)
  const offset = (parsedPage - 1) * parsedLimit

  return await complaintRepository.findMyComplaints(citizenId, {
    status,
    limit: parsedLimit,
    offset
  })
}

async function getComplaintDetail({ userAccountId, complaintId }) {
  if (!userAccountId || !complaintId) {
    throw new ApiError(400, 'Thiếu userAccountId hoặc complaintId.')
  }

  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(403, 'Người dùng không phải là Citizen.')
  }

  const complaint = await complaintRepository.findComplaintDetail(citizenId, complaintId)
  if (!complaint) {
    throw new ApiError(404, 'Không tìm thấy khiếu nại hoặc bạn không có quyền xem.')
  }

  return complaint
}

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintDetail
}
