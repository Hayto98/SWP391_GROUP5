const wasteReportRepository = require('../repositories/wasteReportRepository')
const ApiError = require('../errors/ApiError')
const { v4: uuidv4 } = require('uuid')

// ==================== CREATE ====================

/**
 * Validate và tạo mới một WasteReport
 */
async function createReport({ userAccountId, wasteTypeId, gpsLat, gpsLng, description, fileUri }) {
  // ── Validation ──────────────────────────────────────────────
  const errors = []

  if (!userAccountId) {
    throw new ApiError(401, 'Unauthorized')
  }

  if (!wasteTypeId || isNaN(Number(wasteTypeId))) {
    errors.push('wasteTypeId is required and must be a number')
  } else {
    wasteTypeId = Number(wasteTypeId)
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
  const citizenId = await wasteReportRepository.ensureCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(403, 'Chỉ Citizen mới được tạo báo cáo rác thải.')
  }

  // ── Persist ─────────────────────────────────────────────────
  const wasteReportId = uuidv4()
  const createdAt = new Date()

  try {
    await wasteReportRepository.createReport({
      wasteReportId,
      citizenId,
      wasteTypeId,
      gpsLat,
      gpsLng,
      description: description.trim(),
      fileUri,
      createdAt
    })
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApiError(400, 'wasteTypeId không tồn tại.')
    }
    throw error
  }

  return {
    wasteReportId,
    citizenId,
    wasteTypeId,
    gpsLat,
    gpsLng,
    description: description.trim(),
    attachments: fileUri ? [{ fileUri }] : [],
    status: 'OPEN',
    createdAt
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
  const citizenId = await wasteReportRepository.ensureCitizenIdByUserAccountId(userAccountId)
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
async function getReportById(reportId, userAccountId, roleId) {
  const { ROLES } = require('../utils/constants')

  // 1. Fetch report from repository
  const report = await wasteReportRepository.findReportById(reportId)

  // 2. Check if report exists
  if (!report) {
    throw new ApiError(404, 'Không tìm thấy báo cáo rác thải.')
  }

  // 3. Authorization: Enterprise can view any report, Citizen must own it
  if (roleId === ROLES.ENTERPRISE) {
    // Enterprise is allowed to view any report
  } else {
    // Citizen ownership check
    const citizenId = await wasteReportRepository.ensureCitizenIdByUserAccountId(userAccountId)
    if (!citizenId) {
      throw new ApiError(404, 'Mã định danh công dân không hợp lệ hoặc chưa được khởi tạo. User không phải là Citizen.')
    }
    if (report.citizenId !== citizenId) {
      throw new ApiError(403, 'Bạn không có quyền truy cập báo cáo rác thải này.')
    }
  }

  // Remove the internal citizenId from the response to match the clean spec
  const { citizenId: _, ...cleanReport } = report

  // 4. Return the standardized response
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
  const citizenId = await wasteReportRepository.ensureCitizenIdByUserAccountId(userAccountId)
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

  if (report.status !== 'PENDING') {
    throw new ApiError(400, 'Bạn chỉ có thể cập nhật thông tin khi báo cáo đang ở trạng thái chờ xử lý (PENDING).')
  }

  const normalizedData = {}

  const nextWasteTypeId = updateData?.waste_type_id ?? updateData?.wasteTypeId
  if (nextWasteTypeId !== undefined) {
    if (!isNaN(Number(nextWasteTypeId))) {
      normalizedData.waste_type_id = Number(nextWasteTypeId)
    } else {
      throw new ApiError(400, 'wasteTypeId must be a number')
    }
  }

  const nextGpsLat = updateData?.gps_lat ?? updateData?.gpsLat
  if (nextGpsLat !== undefined) {
    normalizedData.gps_lat = Number(nextGpsLat)
  }

  const nextGpsLng = updateData?.gps_lng ?? updateData?.gpsLng
  if (nextGpsLng !== undefined) {
    normalizedData.gps_lng = Number(nextGpsLng)
  }

  const rawDescription = updateData?.description
  const weightKgRaw = updateData?.weight ?? updateData?.weight_kg ?? updateData?.weightKg ?? updateData?.kg
  const parsedWeightKg = weightKgRaw !== undefined ? Number(weightKgRaw) : undefined

  let normalizedDescription =
    rawDescription !== undefined && rawDescription !== null ? String(rawDescription).trim() : undefined

  if (normalizedDescription !== undefined) {
    normalizedData.description = normalizedDescription
  }

  if (parsedWeightKg !== undefined && Number.isFinite(parsedWeightKg) && parsedWeightKg >= 0) {
    normalizedData.weight = parsedWeightKg
  }

  const fileUri = updateData?.file_uri ?? updateData?.fileUri ?? updateData?.attachments?.[0]?.fileUri
  if (fileUri !== undefined) {
    normalizedData.file_uri = fileUri
  }

  if (
    normalizedData.waste_type_id === undefined &&
    normalizedData.gps_lat === undefined &&
    normalizedData.gps_lng === undefined &&
    normalizedData.description === undefined &&
    normalizedData.weight === undefined &&
    normalizedData.file_uri === undefined
  ) {
    throw new ApiError(400, 'No valid fields provided for update')
  }

  // 3. Update the record
  await wasteReportRepository.updateReportById(reportId, normalizedData)

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
  const citizenId = await wasteReportRepository.ensureCitizenIdByUserAccountId(userAccountId)
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

  if (report.status !== 'PENDING') {
    throw new ApiError(400, 'Bạn chỉ có thể xóa báo cáo khi đang ở trạng thái chờ xử lý (PENDING).')
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
