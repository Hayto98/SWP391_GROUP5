const wasteReportRepository = require('../repositories/wasteReportRepository')
const ApiError = require('../errors/ApiError')
const { v4: uuidv4 } = require('uuid')
const cloudinary = require('../config/cloudinary')

// ==================== HELPERS ====================

/**
 * Upload a Buffer to Cloudinary and return the secure_url.
 * Uses upload_stream so we never write to disk.
 */
function uploadBufferToCloudinary(buffer, mimetype) {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'auto'
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'waste_reports', resource_type: resourceType },
      (error, result) => {
        if (error) return reject(new ApiError(500, 'Cloudinary upload failed: ' + error.message))
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

// ==================== CREATE ====================

/**
 * Validate và tạo mới một WasteReport — supports multipart/form-data with image upload.
 */
async function createReport({ userAccountId, wasteTypeId, gpsLat, gpsLng, description, weight, fileBuffer, fileMimetype }) {
  // ── Validation ──────────────────────────────────────────────
  const errors = []

  if (!userAccountId) {
    throw new ApiError(401, 'Unauthorized')
  }

  if (wasteTypeId === undefined || wasteTypeId === null) {
    errors.push('wasteTypeId is required')
  } else if (!Number.isInteger(Number(wasteTypeId)) || Number(wasteTypeId) <= 0) {
    errors.push('wasteTypeId must be a positive integer')
  }

  if (gpsLat === undefined || gpsLat === null || typeof gpsLat !== 'number' || Number.isNaN(gpsLat)) {
    errors.push('gpsLat must be a valid number')
  }

  if (gpsLng === undefined || gpsLng === null || typeof gpsLng !== 'number' || Number.isNaN(gpsLng)) {
    errors.push('gpsLng must be a valid number')
  }

  if (!description || (typeof description === 'string' && description.trim().length === 0)) {
    errors.push('description is required')
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors)
  }

  // ── Resolve citizenId from userAccountId ─────────────────────
  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(403, 'Chỉ Citizen mới được tạo báo cáo rác thải.')
  }

  // ── Upload image to Cloudinary (if provided) ─────────────────
  let imageUrl = null
  if (fileBuffer) {
    imageUrl = await uploadBufferToCloudinary(fileBuffer, fileMimetype || 'image/jpeg')
  }

  // ── Persist ─────────────────────────────────────────────────
  let created
  try {
    created = await wasteReportRepository.createReport({
      citizenId,
      citizenUserAccountId: userAccountId,
      wasteTypeId: Number(wasteTypeId),
      gpsLat,
      gpsLng,
      description: description.trim(),
      weight: weight ?? null
    })

    // Save Cloudinary URL into ReportAttachment
    if (imageUrl) {
      await wasteReportRepository.createReportAttachment({
        reportAttachmentId: uuidv4(),
        wasteReportId: created.wasteReportId,
        fileUri: imageUrl,
        uploadedAt: new Date()
      })
    }
  } catch (error) {
    if (error.code === 'INVALID_WASTE_TYPE') {
      throw new ApiError(400, error.message)
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApiError(400, 'wasteTypeId không tồn tại.')
    }
    throw error
  }

  return {
    reportId: created.wasteReportId,
    imageUrl,
    status: 'PENDING'
  }
}


// ==================== READ ====================

/**
 * Service to handle WasteReport business logic
 */
async function getMyReports(userAccountId, queryParams) {
  // Extract and parse params
  const { fromDate, toDate, status } = queryParams
  const page = Math.max(1, Number(queryParams.page) || 1)
  const limit = Math.max(1, Number(queryParams.limit) || 10)

  const offset = (page - 1) * limit

  // Identify citizen ID from userAccountId
  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(404, 'Mã định danh công dân không hợp lệ hoặc chưa được khởi tạo. User không phải là Citizen.')
  }

  // Fetch reports from repository
  const { data, total } = await wasteReportRepository.findMyReports(citizenId, {
    fromDate,
    toDate,
    status,
    limit,
    offset
  })

  // Return the standardized response matching SCRUM-14 spec
  return {
    success: true,
    data: data,
    pagination: {
      page,
      limit,
      total
    }
  }
}

/**
 * Get details of a single WasteReport
 */
async function getReportById(reportId, userAccountId) {
  // 1. Identify citizen ID from userAccountId
  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(404, 'Mã định danh công dân không hợp lệ hoặc chưa được khởi tạo. User không phải là Citizen.')
  }

  // 2. Fetch report from repository
  const report = await wasteReportRepository.findReportById(reportId)

  // 3. Check if report exists
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.')
  }

  // 4. Verify ownership (Authorization)
  if (report.citizenId !== citizenId) {
    throw new ApiError(403, 'Bạn không có quyền truy cập báo cáo rác thải này.')
  }

  // Remove the internal citizenId from the response to match the clean spec
  const { citizenId: _, ...cleanReport } = report

  // 5. Return the standardized response
  return {
    success: true,
    data: cleanReport
  }
}

/**
 * Update a WasteReport text fields
 */
async function updateReport(reportId, userAccountId, updateData) {
  // 1. Check if user is citizen
  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(404, 'Mã định danh công dân không hợp lệ hoặc chưa được khởi tạo. User không phải là Citizen.')
  }

  // 2. Fetch report to check exists, owner, and status
  const report = await wasteReportRepository.findReportById(reportId)

  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.')
  }

  if (report.citizenId !== citizenId) {
    throw new ApiError(403, 'Bạn không có quyền cập nhật báo cáo rác thải này.')
  }

  if (report.status !== 'OPEN') {
    throw new ApiError(400, 'Bạn chỉ có thể cập nhật thông tin khi báo cáo đang ở trạng thái chờ xử lý (OPEN).')
  }

  // 3. Update the record
  await wasteReportRepository.updateReportById(reportId, updateData)

  // 4. Fetch and return the updated version
  const updatedReport = await wasteReportRepository.findReportById(reportId)
  const { citizenId: _, ...cleanReport } = updatedReport

  return {
    success: true,
    data: cleanReport
  }
}

/**
 * Delete a WasteReport
 */
async function deleteReport(reportId, userAccountId) {
  // 1. Check if user is citizen
  const citizenId = await wasteReportRepository.findCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(404, 'Mã định danh công dân không hợp lệ hoặc chưa được khởi tạo. User không phải là Citizen.')
  }

  // 2. Fetch report to check exists, owner, and status
  const report = await wasteReportRepository.findReportById(reportId)

  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.')
  }

  if (report.citizenId !== citizenId) {
    throw new ApiError(403, 'Bạn không có quyền xóa báo cáo rác thải này.')
  }

  if (report.status !== 'OPEN') {
    throw new ApiError(400, 'Bạn chỉ có thể xóa báo cáo khi đang ở trạng thái chờ xử lý (OPEN).')
  }

  // 3. Delete the record via repository
  await wasteReportRepository.deleteReportById(reportId)

  return {
    success: true,
    message: 'Đã xóa báo cáo rác thải thành công.'
  }
}

module.exports = {
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport
}
