const wasteReportRepository = require('../repositories/wasteReportRepository')
const ApiError = require('../errors/ApiError')
const { v4: uuidv4 } = require('uuid')
const cloudinary = require('../config/cloudinary')
const sharp = require('sharp')
const db = require('../config/database')
const rewardService = require('./rewardService')
const userRepository = require('../repositories/userRepository')
const notificationService = require('./notificationService')
const { ROLES, NOTIFICATION_TYPES } = require('../utils/constants')

// ==================== HELPERS ====================

/**
 * Compress an image Buffer using sharp before upload.
 * Resizes to max 1200px width, converts to JPEG, quality 80%.
 * Non-image files are passed through unchanged.
 * @private
 */
async function compressImage(buffer, mimetype) {
  if (!mimetype || !mimetype.startsWith('image/')) return buffer
  try {
    return await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
  } catch {
    // If compression fails (e.g. unsupported format), upload the original
    return buffer
  }
}

/**
 * Upload a Buffer to Cloudinary and return the secure_url.
 * Compresses the image first to reduce upload time and storage cost.
 * Uses upload_stream so we never write to disk.
 */
async function uploadBufferToCloudinary(buffer, mimetype) {
  const compressed = await compressImage(buffer, mimetype)
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'waste_reports', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(new ApiError(500, 'Cloudinary upload failed: ' + error.message))
        resolve(result.secure_url)
      }
    )
    stream.end(compressed)
  })
}

// ==================== CREATE ====================

/**
 * Generates a formatted report code: WR-YYYY-NNNN
 */
async function generateReportCode() {
  const currentYear = new Date().getFullYear()

  // Atomically fetch numerical sequence
  const sequenceNumber = await wasteReportRepository.getNextSequence(currentYear)

  // Pad to 4 digits (e.g., 5 becomes '0005')
  const paddedSequence = String(sequenceNumber).padStart(4, '0')

  return `WR-${currentYear}-${paddedSequence}`
}

/**
 * Validate mảng items cho waste report.
 * @param {{ waste_type_id: number|string, quantity: number|string }[]} items
 * @returns {string[]} - Mảng lỗi validation (rỗng nếu hợp lệ)
 */
function validateItems(items) {
  const errors = []

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('Danh sách loại rác (items) là bắt buộc và phải là một mảng.')
    return errors
  }

  if (items.length > 5) {
    errors.push('Số lượng loại rác tối đa là 5.')
  }

  const seenIds = new Set()
  items.forEach((item, index) => {
    const wasteTypeId = Number(item.waste_type_id)
    const quantity = Number(item.quantity)

    if (!Number.isInteger(wasteTypeId) || wasteTypeId <= 0) {
      errors.push(`Item ${index + 1}: waste_type_id phải là số nguyên dương.`)
    } else if (seenIds.has(wasteTypeId)) {
      errors.push(`Item ${index + 1}: waste_type_id ${wasteTypeId} bị trùng lặp trong cùng báo cáo.`)
    } else {
      seenIds.add(wasteTypeId)
    }

    if (isNaN(quantity) || quantity <= 0) {
      errors.push(`Item ${index + 1}: quantity phải là số lớn hơn 0.`)
    }
  })

  return errors
}

/**
 * Validate và tạo mới một WasteReport — supports multipart/form-data with image upload.
 * Hỗ trợ nhiều loại rác thông qua items array.
 */
async function createReport({ userAccountId, items, gpsLat, gpsLng, description, weight, files, fileUriFromBody }) {
  // ── Validation ──────────────────────────────────────────────
  const errors = []

  if (!userAccountId) {
    throw new ApiError(401, 'Không có quyền truy cập.')
  }

  // Validate items array
  const itemErrors = validateItems(items)
  errors.push(...itemErrors)

  if (gpsLat === undefined || gpsLat === null || typeof gpsLat !== 'number' || Number.isNaN(gpsLat)) {
    errors.push('gpsLat phải là một số hợp lệ.')
  }

  if (gpsLng === undefined || gpsLng === null || typeof gpsLng !== 'number' || Number.isNaN(gpsLng)) {
    errors.push('gpsLng phải là một số hợp lệ.')
  }

  if (!description || (typeof description === 'string' && description.trim().length === 0)) {
    errors.push('Mô tả (description) là bắt buộc.')
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Dữ liệu không hợp lệ.', errors)
  }

  // Normalize items
  const normalizedItems = items.map((item) => ({
    waste_type_id: Number(item.waste_type_id),
    quantity: Number(item.quantity)
  }))

  const totalItemWeight = normalizedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const hasExplicitWeight =
    weight !== undefined && weight !== null && String(weight).trim() !== '' && Number.isFinite(Number(weight))
  const normalizedWeight = hasExplicitWeight && Number(weight) >= 0 ? Number(weight) : totalItemWeight

  // Validate waste_type_ids exist in DB
  const wasteTypeIds = normalizedItems.map((i) => i.waste_type_id)
  const invalidIds = await wasteReportRepository.validateWasteTypeIds(wasteTypeIds)
  if (invalidIds.length > 0) {
    throw new ApiError(400, 'Dữ liệu không hợp lệ.', [
      ...invalidIds.map((id) => `waste_type_id ${id} không tồn tại hoặc không còn hoạt động.`)
    ])
  }

  // ── Upload limit validation ────────────────────────────────
  const filesToUpload = files || []
  if (filesToUpload.length > 5) {
    throw new ApiError(400, 'Bạn chỉ được phép tải lên tối đa 5 ảnh.')
  }

  // ── Resolve citizenId from userAccountId ─────────────────────
  const citizenId = await wasteReportRepository.ensureCitizenIdByUserAccountId(userAccountId)
  if (!citizenId) {
    throw new ApiError(403, 'Chỉ Citizen mới được tạo báo cáo rác thải.')
  }

  // ── Upload images to Cloudinary (if files uploaded) or use URL from body ──
  let imageUrls = []
  if (filesToUpload.length > 0) {
    const uploadPromises = filesToUpload.map((file) =>
      uploadBufferToCloudinary(file.buffer, file.mimetype || 'image/jpeg')
    )
    imageUrls = await Promise.all(uploadPromises)
  } else if (fileUriFromBody) {
    imageUrls = [fileUriFromBody]
  }
  const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0] : null

  // ── Generate unique Code and Persist using transaction ────
  let created = null
  let spamResult = null
  let duplicateResult = null
  let isTransactionCommitted = false
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    const currentTime = new Date()

    // STEP 0.5: Spam prevention — rate limit + daily limit
    spamResult = await rewardService.checkSpam(connection, {
      citizenId,
      currentTime
    })
    if (!spamResult.allowed) {
      await connection.rollback()
      connection.release()
      throw new ApiError(429, spamResult.message)
    }

    // DUPLICATE REPORT DETECTION
    duplicateResult = await rewardService.checkDuplicateAndHandleSpam(connection, {
      citizenId,
      gpsLat,
      gpsLng,
      description: description.trim(),
      fileUri: primaryImageUrl || null,
      currentTime
    })

    if (duplicateResult.isDuplicate) {
      await connection.commit()
      isTransactionCommitted = true
      connection.release()
      throw new ApiError(400, duplicateResult.message || 'Báo cáo này bị trùng')
    }

    const reportCode = await generateReportCode()

    created = await wasteReportRepository.createReport(
      {
        citizenId,
        citizenUserAccountId: userAccountId,
        items: normalizedItems,
        reportCode,
        gpsLat,
        gpsLng,
        description: description.trim(),
        weight: normalizedWeight,
        fileUri: primaryImageUrl || null,
        isDuplicate: duplicateResult.isDuplicate
      },
      connection
    )

    // Lọc ảnh đầu tiên (đã lưu ở file_uri của wastereport) và lưu các ảnh còn lại vào reportattachment (hoặc lưu tất cả)
    // Tùy theo thiết kế, ta lưu tất cả các ảnh vào reportattachment để dễ truy xuất
    if (imageUrls.length > 0) {
      for (const url of imageUrls) {
        await wasteReportRepository.createReportAttachment(
          {
            reportAttachmentId: uuidv4(),
            wasteReportId: created.wasteReportId,
            fileUri: url,
            uploadedAt: new Date()
          },
          connection
        )
      }
    }

    await connection.commit()
    isTransactionCommitted = true
  } catch (error) {
    if (connection && !isTransactionCommitted) await connection.rollback()

    if (error.status === 400 || error.status === 429) throw error
    console.error('[createReport] DB Error:', error.code, error.message)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApiError(400, `Lỗi FK constraint: ${error.message}`)
    }
    throw error
  } finally {
    if (connection && !isTransactionCommitted) connection.release()
  }

  // ── Send notifications to Enterprises ───────────────────────
  try {
    const enterprises = await userRepository.findAll({ roleId: ROLES.ENTERPRISE })
    console.log(`[DEBUG] Notifying ${enterprises.length} Enterprises of new report ${created.wasteReportId}`)
    for (const ent of enterprises) {
      console.log(`[DEBUG] Sending notif to Enterprise: ${ent.userAccountId || ent.user_account_id}`)
      await notificationService.createNotification({
        notificationType: NOTIFICATION_TYPES.NEW_REPORT_PENDING,
        recipientUserAccountId: ent.userAccountId || ent.user_account_id,
        wasteReportId: created.wasteReportId,
        message: `Có báo cáo rác thải mới (${created.reportCode || created?.report_code}) đang chờ xử lý.`
      })
    }
  } catch (notifError) {
    console.error('Failed to notify enterprises of new report:', notifError.message)
  }

  // Lấy items kèm thông tin wastetype để trả về
  const reportItems = await wasteReportRepository.findWasteReportItems(created.wasteReportId)

  return {
    reportId: created.wasteReportId,
    reportCode: created.reportCode || created?.report_code,
    citizenId,
    items: reportItems,
    gpsLat,
    gpsLng,
    description: description.trim(),
    weight: normalizedWeight,
    images: imageUrls.length > 0 ? imageUrls.map((url) => ({ file_uri: url })) : [],
    status: 'PENDING',
    isSpam: spamResult?.isSpam || false,
    spamMessage: spamResult?.isSpam ? spamResult.message : undefined,
    isDuplicate: duplicateResult?.isDuplicate || false,
    duplicateMessage: duplicateResult?.isDuplicate ? duplicateResult.message : undefined,
    createdAt: created.createdAt
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
 * Update a WasteReport — hỗ trợ cập nhật items (REPLACE strategy).
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

  // 3. Validate and normalize items if provided
  const items = updateData?.items
  let normalizedItems = null

  if (items !== undefined) {
    const itemErrors = validateItems(items)
    if (itemErrors.length > 0) {
      throw new ApiError(400, 'Dữ liệu không hợp lệ.', itemErrors)
    }

    normalizedItems = items.map((item) => ({
      waste_type_id: Number(item.waste_type_id),
      quantity: Number(item.quantity)
    }))

    // Validate waste_type_ids exist in DB
    const wasteTypeIds = normalizedItems.map((i) => i.waste_type_id)
    const invalidIds = await wasteReportRepository.validateWasteTypeIds(wasteTypeIds)
    if (invalidIds.length > 0) {
      throw new ApiError(400, 'Dữ liệu không hợp lệ.', [
        ...invalidIds.map((id) => `waste_type_id ${id} không tồn tại hoặc không còn hoạt động.`)
      ])
    }
  }

  // 4. Normalize other update fields
  const normalizedData = {}

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

  if (normalizedItems) {
    // Calculate total weight from items if updating items
    const totalWeight = normalizedItems.reduce((sum, item) => sum + item.quantity, 0)
    normalizedData.weight = totalWeight
  } else if (parsedWeightKg !== undefined && Number.isFinite(parsedWeightKg) && parsedWeightKg >= 0) {
    // Or from the body explicitly (if not updating items)
    normalizedData.weight = parsedWeightKg
  }

  // Upload files to Cloudinary if provided
  const filesToUpload = updateData?.files || []
  let imageUrls = []

  if (filesToUpload.length > 0) {
    const uploadPromises = filesToUpload.map((file) =>
      uploadBufferToCloudinary(file.buffer, file.mimetype || 'image/jpeg')
    )
    imageUrls = await Promise.all(uploadPromises)
    if (imageUrls.length > 0) {
      normalizedData.file_uri = imageUrls[0]
    }
  }

  const fileUri = updateData?.file_uri ?? updateData?.fileUri ?? updateData?.attachments?.[0]?.fileUri
  if (fileUri !== undefined && !normalizedData.file_uri) {
    normalizedData.file_uri = fileUri
  }

  // Check if there's anything to update
  const hasFieldUpdates = Object.keys(normalizedData).length > 0
  const hasItemUpdates = normalizedItems !== null
  const hasAttachmentUpdates = imageUrls.length > 0

  if (!hasFieldUpdates && !hasItemUpdates && !hasAttachmentUpdates) {
    throw new ApiError(400, 'Không có trường hợp lệ nào để cập nhật.')
  }

  // 5. Use transaction for REPLACE strategy on items + attachments
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    // Update basic fields on wastereport table
    if (hasFieldUpdates) {
      await wasteReportRepository.updateReportById(reportId, normalizedData, connection)
    }

    // Replace new attachments if any
    if (hasAttachmentUpdates) {
      // Đầu tiên xóa toàn bộ ảnh cũ
      await wasteReportRepository.deleteReportAttachments(reportId, connection)

      // Chèn lại ảnh mới
      for (const url of imageUrls) {
        await wasteReportRepository.createReportAttachment(
          {
            reportAttachmentId: uuidv4(),
            wasteReportId: reportId,
            fileUri: url,
            uploadedAt: new Date()
          },
          connection
        )
      }
    }

    // REPLACE strategy: DELETE old items → INSERT new items
    if (hasItemUpdates) {
      await wasteReportRepository.deleteWasteReportItems(reportId, connection)
      await wasteReportRepository.insertWasteReportItems(reportId, normalizedItems, connection)
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  // 6. Fetch and return the updated version
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

  // 3. Delete the record via repository (Soft Delete)
  await wasteReportRepository.deleteReportById(reportId, userAccountId)

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
