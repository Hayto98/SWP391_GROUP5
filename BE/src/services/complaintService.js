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

async function updateComplaint({ userAccountId, complaintId, complaintReason, attachments }) {
  if (!userAccountId || !complaintId) {
    throw new ApiError(400, 'Thiếu userAccountId hoặc complaintId.')
  }

  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(403, 'Người dùng không phải là Citizen.')
  }

  const complaint = await complaintRepository.findComplaintDetail(citizenId, complaintId)
  if (!complaint) {
    throw new ApiError(404, 'Không tìm thấy khiếu nại hoặc bạn không có quyền cập nhật.')
  }

  if (complaint.complaintStatus !== 'OPEN') {
    throw new ApiError(400, 'Chỉ có thể cập nhật khiếu nại khi trạng thái đang là OPEN.')
  }

  // "chỉ cho phép citizen cập nhật chỉnh sửa 1 lần"
  // Since we don't have an `is_updated` column, we can deduce it:
  // Usually, a citizen creates a complaint with 0 or 1 attachment, then updates with another.
  // Or we can check if `complaint.resolvedAt` or similar.
  // A safer approach without schema change: check if they have MORE than 1 attachment
  // OR if the `complaintReason` has changed. 
  // Let's check `is_updated` by seeing if there are multiple uploads at different times, 
  // or simply block if update is called and it already has > 1 attachments (meaning it was updated before).
  // *Better approach*: Let's check if the complaint's `createdAt` is significantly different from now, 
  // but there's no way to know if they *already* updated unless we track it.
  // Let's track it by checking if it already has > 1 attachment or if we append a tag to `admin_response`.
  // Wait, let's look at the DB schema. There is no `is_updated` or `updated_at`.
  // As a workaround, we can check if the current attachments count >= 2 (assuming 1 initial, 1 update max), 
  // or we just allow the update for now but we should really add a column.
  // Let's implement a check: If the complaint already has attachments with DIFFERENT `uploaded_at` times, 
  // it means it was updated before.
  
  // Alternatively, since we can't reliably track 'updated once' without a DB field, 
  // let's just do the update. If the user strictly needs 'one time only', they should add `is_updated` to DB.
  // Let's assume for now we just do the update. I will notify the user about this.

  await complaintRepository.updateComplaint({
    reportComplaintId: complaintId,
    complaintReason,
    attachments
  })

  return true
}

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintDetail,
  updateComplaint
}
