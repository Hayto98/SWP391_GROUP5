const complaintRepository = require('../repositories/complaintRepository')
const wasteReportRepository = require('../repositories/wasteReportRepository')
const rewardRepository = require('../repositories/rewardRepository')
const db = require('../config/database')
const ApiError = require('../errors/ApiError')
const cloudinary = require('../config/cloudinary')
const sharp = require('sharp')
const { v4: uuidv4 } = require('uuid')

async function compressImage(buffer, mimetype) {
  if (!mimetype || !mimetype.startsWith('image/')) return buffer
  try {
    return await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
  } catch {
    return buffer
  }
}

async function uploadBufferToCloudinary(buffer, mimetype) {
  const compressed = await compressImage(buffer, mimetype)
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'complaint_attachments', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(new ApiError(500, 'Cloudinary upload failed: ' + error.message))
        resolve(result.secure_url)
      }
    )
    stream.end(compressed)
  })
}

async function createComplaint({
  userAccountId,
  wasteReportId,
  complaintReason,
  attachments,
  fileBuffer,
  fileMimetype,
  fileUriFromBody
}) {
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
  if (
    report.status !== 'ASSIGNED' &&
    report.status !== 'IN_PROGRESS' &&
    report.status !== 'COLLECTED' &&
    report.status !== 'REJECTED'
  ) {
    throw new ApiError(
      400,
      'Chỉ có thể khiếu nại rác thải ở trạng thái Đã được phân công (ASSIGNED), Đang thu gom (IN_PROGRESS) hoặc Đã thu gom (COLLECTED).'
    )
  }

  // Xác thực citizen chỉ được tạo 1 complaint cho 1 report
  const existingComplaint = await complaintRepository.findComplaintByCitizenAndReport(citizenId, wasteReportId)
  if (existingComplaint) {
    throw new ApiError(409, 'Bạn đã gửi khiếu nại cho báo cáo rác thải này rồi.')
  }

  const normalizedAttachments = Array.isArray(attachments)
    ? attachments.filter((item) => item && item.fileUri).map((item) => ({ fileUri: item.fileUri }))
    : []

  if (fileBuffer) {
    const uploadedUrl = await uploadBufferToCloudinary(fileBuffer, fileMimetype || 'image/jpeg')
    normalizedAttachments.push({ fileUri: uploadedUrl })
  } else if (fileUriFromBody) {
    normalizedAttachments.push({ fileUri: fileUriFromBody })
  }

  // Insert vào bảng
  const reportComplaintId = await complaintRepository.createComplaint({
    wasteReportId,
    citizenId,
    complaintReason,
    attachments: normalizedAttachments
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

  if (complaint.isUpdated) {
    throw new ApiError(400, 'Bạn chỉ được phép cập nhật khiếu nại tối đa 1 lần.')
  }

  await complaintRepository.updateComplaint({
    reportComplaintId: complaintId,
    complaintReason,
    attachments
  })

  return true
}

async function softDeleteComplaint({ userAccountId, complaintId }) {
  if (!userAccountId || !complaintId) {
    throw new ApiError(400, 'Thiếu userAccountId hoặc complaintId.')
  }

  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(403, 'Người dùng không phải là Citizen.')
  }

  const complaint = await complaintRepository.findComplaintDetail(citizenId, complaintId)
  if (!complaint) {
    throw new ApiError(404, 'Không tìm thấy khiếu nại hoặc bạn không có quyền xóa.')
  }

  if (complaint.complaintStatus !== 'OPEN') {
    throw new ApiError(400, 'Chỉ có thể xóa khiếu nại khi trạng thái đang là OPEN.')
  }

  await complaintRepository.softDeleteComplaint(complaintId)

  return true
}

async function resolveComplaint({ adminId, complaintId, adminResponse, refundPoints }) {
  if (!complaintId) {
    throw new ApiError(400, 'Thiếu complaintId.')
  }

  const complaint = await complaintRepository.findComplaintById(complaintId)
  if (!complaint) {
    throw new ApiError(404, 'Không tìm thấy khiếu nại.')
  }

  if (complaint.complaintStatus !== 'OPEN') {
    throw new ApiError(400, 'Chỉ có thể xử lý khiếu nại đang ở trạng thái OPEN.')
  }

  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Resolve the complaint
    await complaintRepository.resolveComplaint(connection, {
      complaintId,
      adminResponse,
      refundPoints: refundPoints || 0,
      adminId
    })

    // 2. Process refund if points > 0
    if (refundPoints > 0) {
      // Update citizen total points
      await rewardRepository.updateCitizenPoints(connection, complaint.citizenId, refundPoints)

      // Create point transaction record
      await rewardRepository.insertPointTransaction(connection, {
        pointTransactionId: uuidv4(),
        citizenId: complaint.citizenId,
        wasteReportId: complaint.wasteReportId,
        pointsDelta: refundPoints,
        transactionReason: `[REFUND_COMPLAINT] Hoàn điểm từ khiếu nại: ${complaintId}`,
        createdAt: new Date()
      })
    }

    await connection.commit()
    return {
      success: true,
      message: 'Complaint resolved and points refunded',
      refundPoints: refundPoints || 0
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintDetail,
  updateComplaint,
  softDeleteComplaint,
  resolveComplaint
}
