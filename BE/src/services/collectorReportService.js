const collectorReportRepository = require('../repositories/collectorReportRepository')
const wasteReportRepository = require('../repositories/wasteReportRepository')
const userRepository = require('../repositories/userRepository')
const ApiError = require('../errors/ApiError')
const cloudinary = require('../config/cloudinary')
const notificationService = require('./notificationService')
const notificationRepository = require('../repositories/notificationRepository')
const { ROLES, NOTIFICATION_TYPES } = require('../utils/constants')
const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')
const rewardService = require('./rewardService')
/**
 * Upload a Buffer to Cloudinary and return secure_url.
 * @private
 */
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'collector_completions', resource_type: 'image' },
      (err, result) => {
        if (err) return reject(new ApiError(500, 'Cloudinary upload failed: ' + err.message))
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

/**
 * Service: Get waste reports assigned to the current collector.
 *
 * Business rules:
 *   - User must not be locked (is_locked = true → 403)
 *   - Returns reports with status in ('ASSIGNED', 'IN_PROGRESS', 'COLLECTED')
 *     and assigned_collector_id = currentUserId
 *   - Supports optional filter: wasteTypeId (exact)
 *   - Supports pagination: page (default 1), limit (default 10)
 *
 * @param {string} userId - The authenticated user's ID (from JWT sub)
 * @param {object} queryParams - Raw query parameters from the request
 * @returns {object} Standardized response with items and pagination
 */
async function getAssignedReports(userId, queryParams) {
  // ── 1. Check if user account is locked ──────────────────────────────
  const user = await userRepository.findById(userId)

  if (!user) {
    throw new ApiError(404, 'User account not found')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Your account is locked. Please contact support.')
  }

  // ── 2. Validate & sanitize query params ─────────────────────────────
  const page = Math.max(1, Number(queryParams.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(queryParams.limit) || 10))
  const offset = (page - 1) * limit

  const wasteTypeId = queryParams.wasteTypeId ? String(queryParams.wasteTypeId).trim() : null

  // ── 3. Fetch from repository ────────────────────────────────────────
  const { reports, total } = await collectorReportRepository.findAssignedReports(userId, {
    wasteTypeId,
    limit,
    offset
  })

  // ── 4. Repository already returns fully-mapped DTOs, use directly ───
  // (Do NOT remap — fields like waste_report_id, gps_lat no longer exist on these objects)
  const items = reports.map((report) => ({
    ...report,
    wasteCode: report?.wasteCode || report?.reportCode || report?.reportId || null
  }))

  // ── 5. Return standardized response ─────────────────────────────────
  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total
      }
    }
  }
}

module.exports = {
  getAssignedReports,
  getReportById,
  acceptAssignedReport,
  submitResult,
  completeReport,
  markReportAsFake,
  getCollectionResult,
  scheduleCollection
}

// ==================== SCHEDULE COLLECTION ====================

/**
 * PATCH /collector/reports/:reportId/schedule
 * Collector sets the scheduled collection time for a waste report.
 *
 * Business rules:
 *   - User must not be locked
 *   - Report must exist (404)
 *   - Report must be assigned to this collector (403)
 *   - scheduledCollectAt is required and must be a valid future datetime
 *
 * @param {string} collectorId - user_account_id of the collector
 * @param {string} reportId    - waste_report_id
 * @param {string} scheduledCollectAt - ISO datetime string
 * @returns {object} Success response
 */
async function scheduleCollection(collectorId, reportId, scheduledCollectAt) {
  // 1. Check collector account
  const user = await userRepository.findById(collectorId)
  if (!user) {
    throw new ApiError(404, 'User account not found')
  }
  if (user.isLocked) {
    throw new ApiError(403, 'Your account is locked. Please contact support.')
  }

  // 2. Validate scheduledCollectAt
  if (!scheduledCollectAt) {
    throw new ApiError(400, 'scheduledCollectAt is required')
  }
  const parsedDate = new Date(scheduledCollectAt)
  if (isNaN(parsedDate.getTime())) {
    throw new ApiError(400, 'scheduledCollectAt must be a valid datetime')
  }

  // 3. Fetch report to verify existence
  const report = await collectorReportRepository.findReportById(reportId)
  if (!report) {
    throw new ApiError(404, 'Report not found')
  }

  // 4. Must be the assigned collector
  if (report.assigned_collector_id !== collectorId) {
    throw new ApiError(403, 'You are not the assigned collector for this report')
  }

  // 5. Update scheduled_collect_at
  const updated = await wasteReportRepository.updateScheduledCollectAt(reportId, collectorId, parsedDate)

  if (!updated) {
    throw new ApiError(500, 'Failed to update scheduled collection time')
  }

  // 6. Create notification for the citizen
  try {
    const citizenUserAccountId = await notificationRepository.findCitizenUserAccountIdByReportId(reportId)
    if (citizenUserAccountId) {
      await notificationService.createNotification({
        notificationType: NOTIFICATION_TYPES.COLLECTION_SCHEDULED,
        recipientUserAccountId: citizenUserAccountId,
        wasteReportId: reportId,
        message: `Người thu gom dự kiến sẽ đến vào lúc ${parsedDate.toLocaleString('vi-VN')}`
      })
    }
  } catch (notifError) {
    // Notification failure should not break the schedule flow
    console.error('Failed to create schedule notification:', notifError.message)
  }

  return {
    success: true,
    message: 'Collection time scheduled successfully'
  }
}

// ==================== DETAIL BY ID ====================

/**
 * Get a single report detail for the authenticated collector.
 *
 * Business rules:
 *   - User must not be locked
 *   - Report must exist (404)
 *   - Report must be ASSIGNED to this collector (403)
 *
 * @param {string} userId - Collector's user_account_id
 * @param {string} reportId - waste_report_id
 * @returns {object} Standardized response
 */
async function getReportById(userId, reportId) {
  // 1️⃣ Check user
  const user = await userRepository.findById(userId)

  if (!user) {
    throw new ApiError(404, 'User account not found')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Your account is locked. Please contact support.')
  }

  // 2️⃣ Validate reportId
  if (!reportId || typeof reportId !== 'string' || reportId.trim().length === 0) {
    throw new ApiError(400, 'Report ID is required')
  }

  // 3️⃣ Fetch report by ID only (no auth filter in SQL)
  const report = await collectorReportRepository.findReportForCollector(reportId)

  // 404: report does not exist at all
  if (!report) {
    throw new ApiError(404, 'Report not found')
  }

  // 403: report exists but not assigned to this collector
  if (report.assigned_collector_id !== userId) {
    throw new ApiError(403, 'You do not have permission to view this report')
  }

  // ✅ No status restriction — collector can view their report at any status
  // (ASSIGNED, IN_PROGRESS, COLLECTED). Ownership check above is sufficient.

  // 5️⃣ Fetch citizen images + collected record + items.
  // Primary source: joined GROUP_CONCAT from findReportForCollector.
  // Fallback source: direct read from reportattachment table.
  const [fallbackCitizenImages, collectedRecord, reportItems] = await Promise.all([
    collectorReportRepository.findImagesByReportId(reportId),
    collectorReportRepository.findCollectedRecord(reportId, userId),
    wasteReportRepository.findWasteReportItems(reportId)
  ])

  const joinedUris = report.citizen_image_uris
    ? report.citizen_image_uris
      .split('|||')
      .map((value) => value.trim())
      .filter(Boolean)
    : []

  const fallbackUris = Array.isArray(fallbackCitizenImages)
    ? fallbackCitizenImages.map((item) => (item?.file_uri || '').trim()).filter(Boolean)
    : []

  const reportFileUri = typeof report?.report_file_uri === 'string' ? report.report_file_uri.trim() : ''

  const allCitizenUris = [...joinedUris, ...fallbackUris]
  if (reportFileUri) {
    allCitizenUris.push(reportFileUri)
  }

  const citizenImages = [...new Set(allCitizenUris)].filter(Boolean).map((fileUri) => ({ file_uri: fileUri }))

  // 6️⃣ Map DTO (use alias names!)
  return {
    success: true,
    data: {
      reportId: report.waste_report_id,
      reportCode: report.reportCode || null,
      wasteCode: report.reportCode || report.waste_report_id || null,

      citizen: {
        fullname: report.citizenFullname,
        phone: report.citizenPhone
      },

      collector: {
        userAccountId: report.assigned_collector_id,
        fullname: report.collectorFullname ?? null,
        phone: report.collectorPhone ?? null
      },

      wasteType: {
        id: report.wasteTypeId,
        name: report.wasteTypeName
      },

      items: reportItems,

      weight: report.weight !== null ? Number(report.weight) : null,

      actualQuantity: collectedRecord ? Number(collectedRecord.actual_quantity_value) : null,

      unitType: collectedRecord?.quantity_unit ?? report.unitType ?? null,

      location: {
        lat: report.lat !== null ? Number(report.lat) : null,
        lng: report.lng !== null ? Number(report.lng) : null
      },

      // Backward-compatible key used by current FE pages.
      images: citizenImages,

      // Explicit alias to clarify these are original citizen report images.
      citizenImages,

      collectorImages: collectedRecord
        ? [collectedRecord.file_uri, ...(collectedRecord.completion_images || [])].filter(Boolean)
        : [],

      collectedRecord: collectedRecord
        ? {
          collectedRecordId: collectedRecord.collected_record_id,
          wasteReportId: collectedRecord.waste_report_id,
          collectorUserAccountId: collectedRecord.collector_user_account_id,
          actualQuantityValue: Number(collectedRecord.actual_quantity_value),
          quantityUnit: collectedRecord.quantity_unit,
          recordedAt: collectedRecord.recorded_at,
          fileUri: collectedRecord.file_uri,
          note: collectedRecord.note,
          completionImages: collectedRecord.completion_images || []
        }
        : null,

      status: report.status
    }
  }
}

// ==================== ACCEPT REPORT ====================

const ASSIGNED_STATUS_ID = 3
const IN_PROGRESS_STATUS_ID = 6
const MAX_ACTIVE_REPORTS = 10

/**
 * Accept an ASSIGNED report — transitions it to IN_PROGRESS.
 *
 * Business rules:
 *   BR-29: Collector must not be locked.
 *   BR-42: Collector must have fewer than 10 active reports.
 *   Report must exist (404).
 *   Report must be ASSIGNED to this collector (403).
 *
 * @param {string} collectorId - user_account_id of the collector
 * @param {string} reportId    - waste_report_id to accept
 * @returns {object} Standardized response
 */
async function acceptAssignedReport(collectorId, reportId) {
  // ── 1. Check collector account is not locked ─────────────────────
  const user = await userRepository.findById(collectorId)
  if (!user) {
    throw new ApiError(404, 'User account not found')
  }
  if (user.isLocked) {
    throw new ApiError(403, 'Your account is locked. Please contact support.')
  }

  // ── 2. Fetch the report (existence check — no auth filter in SQL) ─
  const report = await collectorReportRepository.findReportById(reportId)
  if (!report) {
    throw new ApiError(404, 'Report not found')
  }

  // ── 3. Authorization: must be assigned to this collector ──────────
  if (report.assigned_collector_id !== collectorId) {
    throw new ApiError(403, 'You do not have permission to accept this report')
  }

  // ── 4. Status must be ASSIGNED ────────────────────────────────────
  if (report.report_status_type_id !== ASSIGNED_STATUS_ID) {
    throw new ApiError(403, 'Only reports with status ASSIGNED can be accepted')
  }

  // ── 5. BR-42: collector must not exceed 10 active reports ─────────
  const activeCount = await collectorReportRepository.countActiveReports(collectorId)
  if (activeCount >= MAX_ACTIVE_REPORTS) {
    throw new ApiError(
      403,
      `You have reached the maximum of ${MAX_ACTIVE_REPORTS} active reports. Please complete some before accepting new ones.`
    )
  }

  // ── 6. Transaction: update status + insert history ────────────────
  const acceptedAt = new Date()
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await collectorReportRepository.updateReportStatus(connection, reportId, IN_PROGRESS_STATUS_ID)

    await collectorReportRepository.insertStatusHistory(
      connection,
      reportId,
      IN_PROGRESS_STATUS_ID,
      collectorId,
      acceptedAt
    )

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  // ── 7. Return result ─────────────────────────────────────────────
  return {
    success: true,
    data: {
      reportId,
      previousStatus: 'ASSIGNED',
      newStatus: 'IN_PROGRESS',
      acceptedAt
    }
  }
}

// ==================== SUBMIT RESULT ====================

/**
 * Submit the collection result for an ASSIGNED report.
 *
 * Business rules:
 *   - Report must exist (404)
 *   - Report status must be ASSIGNED (400)
 *   - Logged-in collector must match assigned_collector_id (403)
 *   - actualQuantity must be > 0 (400)
 *   - |actualQuantity - estimatedQuantity| <= 1 KG tolerance (400)
 *
 * On success (transactional):
 *   1. INSERT into CollectedRecord
 *
 * @param {string} collectorId
 * @param {string} reportId
 * @param {object} body
 * @param {number} body.actualQuantity
 * @param {string} [body.note]
 * @param {string} [body.file_uri]
 * @param {object} [attachedFile]   multer file object (req.file)
 */
async function submitResult(collectorId, reportId, { actualQuantity, note, quantity_unit, file_uri }, attachedFile) {
  // ── 1. Validate collectorId / account ────────────────────────────
  const user = await userRepository.findById(collectorId)
  if (!user) throw new ApiError(404, 'User account not found')
  if (user.isLocked) throw new ApiError(403, 'Your account is locked. Please contact support.')

  // ── 2. Validate actualQuantity ───────────────────────────────────
  const qty = Number(actualQuantity)
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new ApiError(400, 'actualQuantity must be a number greater than 0')
  }

  // ── 3. Fetch report ──────────────────────────────────────────────
  const report = await collectorReportRepository.findReportForResult(reportId)
  if (!report) throw new ApiError(404, 'Report not found')

  // ── 4. Status must be IN_PROGRESS (collector already accepted) ──────
  // Workflow: PENDING → ASSIGNED → (accept) → IN_PROGRESS → (submit result) → COLLECTED
  if (report.status !== 'IN_PROGRESS') {
    throw new ApiError(400, `Report must be in IN_PROGRESS status to submit result. Current status: ${report.status}`)
  }

  // ── 5. Authorization: must be the assigned collector ─────────────
  if (report.assigned_collector_id !== collectorId) {
    throw new ApiError(403, 'You are not the assigned collector for this report')
  }

  // ── 6. Calculate difference (informational — no hard tolerance enforced) ──
  const estimatedQty = report.weight !== null ? Number(report.weight) : null
  let difference = null

  if (estimatedQty !== null) {
    difference = qty - estimatedQty
    // ⚠️  Tolerance check disabled — re-enable if needed:
    // if (Math.abs(difference) > TOLERANCE_KG) {
    //   throw new ApiError(400, `Difference (${difference.toFixed(2)} KG) exceeds ±${TOLERANCE_KG} KG`)
    // }
  }

  // ── 6.5. Upload file if provided ─────────────────────────────────
  let finalFileUri = file_uri ?? null
  if (attachedFile && attachedFile.buffer) {
    finalFileUri = await uploadBufferToCloudinary(attachedFile.buffer, attachedFile.mimetype)
  }

  // ── 7. Transaction ───────────────────────────────────────────────
  const recordedAt = new Date()
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    // 7a. Insert CollectedRecord
    await collectorReportRepository.insertCollectedRecord(connection, {
      collectedRecordId: uuidv4(),
      wasteReportId: reportId,
      collectorUserAccountId: collectorId,
      actualQuantityValue: qty,
      quantityUnit: quantity_unit || 'KG',
      note: note ?? null,
      fileUri: finalFileUri,
      recordedAt
    })

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  // ── 8. Return result ─────────────────────────────────────────────
  return {
    success: true,
    data: {
      reportId,
      estimatedQuantity: estimatedQty,
      actualQuantity: qty,
      difference: difference !== null ? Number(difference.toFixed(2)) : null
    }
  }
}

// ==================== COMPLETE REPORT ====================

/**
 * Complete an IN_PROGRESS report — single step:
 *   1. Validate status + ownership
 *   2. Upload images to Cloudinary
 *   3. Transaction:
 *      a. INSERT CollectedRecord
 *      b. INSERT CompletionAttachment per image
 *      c. UPDATE WasteReport status → COLLECTED (4)
 *      d. INSERT ReportStatusHistory
 *
 * @param {string} collectorId
 * @param {string} reportId
 * @param {object} body  { actualItems, quantityUnit, note }
 * @param {Array}  files  multer file objects (req.files)
 */
async function completeReport(collectorId, reportId, { actualItems, quantityUnit, note }, files) {
  // 1. Account check
  const user = await userRepository.findById(collectorId)
  if (!user) throw new ApiError(404, 'User account not found')
  if (user.isLocked) throw new ApiError(403, 'Your account is locked. Please contact support.')

  // 2. Validate actualItems
  if (!Array.isArray(actualItems) || actualItems.length === 0) {
    throw new ApiError(400, 'actualItems phải là một mảng và không được để trống')
  }

  let qty = 0
  const normalizedItems = []
  for (let i = 0; i < actualItems.length; i++) {
    const item = actualItems[i]
    const wId = Number(item.waste_type_id)
    const q = Number(item.actual_quantity)
    if (!Number.isInteger(wId) || wId <= 0 || !Number.isFinite(q) || q <= 0) {
      throw new ApiError(400, `Item ${i + 1}: waste_type_id và actual_quantity phải hợp lệ (lớn hơn 0)`)
    }
    qty += q
    normalizedItems.push({ waste_type_id: wId, actual_quantity: q })
  }

  // 3. Fetch report (with citizen_id and waste_type_id for points)
  const report = await collectorReportRepository.findReportForComplete(reportId, collectorId)
  if (!report) throw new ApiError(404, 'Report not found')

  // 4. Status must be IN_PROGRESS
  if (report.status !== 'IN_PROGRESS') {
    throw new ApiError(400, `Report must be in IN_PROGRESS status to complete. Current status: ${report.status}`)
  }

  // 5. Must be the assigned collector
  if (report.assigned_collector_id !== collectorId) {
    throw new ApiError(403, 'You are not the assigned collector for this report')
  }

  // 6. Upload images to Cloudinary (before transaction — avoid holding DB locks during HTTP calls)
  const uploadedUrls = []
  if (files && files.length > 0) {
    for (const file of files) {
      const url = await uploadBufferToCloudinary(file.buffer, file.mimetype)
      uploadedUrls.push(url)
    }
  }

  // 7. Transaction
  const recordedAt = new Date()
  const collectedRecordId = uuidv4()
  const connection = await db.getConnection()

  let processReward = 0
  let rewardResult = null
  let pointsAwarded = 0

  try {
    await connection.beginTransaction()

    // 7a. Look up COLLECTED status ID
    const collectedStatusId = await collectorReportRepository.findStatusTypeIdByName(connection, 'COLLECTED')
    if (!collectedStatusId) throw new Error('COLLECTED status type not found in ReportStatusType table')

    // 7b. Insert CollectedRecord
    await collectorReportRepository.insertCollectedRecord(connection, {
      collectedRecordId,
      wasteReportId: reportId,
      collectorUserAccountId: collectorId,
      actualQuantityValue: qty, // Total quantity
      quantityUnit: quantityUnit || 'KG',
      note: note ?? null,
      fileUri: null,
      recordedAt
    })

    // 7b2. Insert Collected Items
    await collectorReportRepository.insertCollectedItems(connection, collectedRecordId, normalizedItems)

    // 7c. Insert CompletionAttachment for each uploaded image
    for (const url of uploadedUrls) {
      await collectorReportRepository.insertCompletionAttachment(connection, {
        completionAttachmentId: uuidv4(),
        collectedRecordId,
        fileUri: url,
        uploadedAt: recordedAt
      })
    }

    // 7d. Update WasteReport status → COLLECTED
    await collectorReportRepository.updateReportStatus(connection, reportId, collectedStatusId)

    // 7e. Insert ReportStatusHistory
    await collectorReportRepository.insertStatusHistory(
      connection,
      reportId,
      collectedStatusId,
      collectorId,
      recordedAt
    )

    // 7f. Process reward (multi-item logic)
    rewardResult = await rewardService.processRewardMultiItems(connection, {
      citizenId: report.citizen_id,
      userAccountId: report.citizen_user_account_id,
      wasteReportId: reportId,
      collectedRecordId,
      currentTime: recordedAt
    })
    pointsAwarded = rewardResult.finalPoints

    // 7g. Create notifications for citizen (inside transaction)
    const citizenUserAccountId =
      report.citizen_user_account_id || (await notificationRepository.findCitizenUserAccountIdByReportId(reportId))

    if (citizenUserAccountId) {
      if (pointsAwarded > 0) {
        await notificationService.createNotification(
          {
            notificationType: NOTIFICATION_TYPES.POINT_REWARDED,
            recipientUserAccountId: citizenUserAccountId,
            wasteReportId: reportId,
            message: `Bạn đã nhận được ${pointsAwarded} điểm thưởng từ báo cáo rác thải.`
          },
          connection
        )
      }

      await notificationService.createNotification(
        {
          notificationType: NOTIFICATION_TYPES.COLLECTION_COMPLETED,
          recipientUserAccountId: citizenUserAccountId,
          wasteReportId: reportId,
          message: 'Đơn thu gom của bạn đã hoàn thành thành công.'
        },
        connection
      )
    }

    // 7h. Notify all Enterprises that the report is completed
    const enterprises = await userRepository.findAll({ roleId: ROLES.ENTERPRISE })
    for (const ent of enterprises) {
      await notificationService.createNotification(
        {
          notificationType: NOTIFICATION_TYPES.REPORT_COMPLETED,
          recipientUserAccountId: ent.userAccountId,
          wasteReportId: reportId,
          message: `Báo cáo rác thải (${report.report_code || reportId}) đã được hoàn thành bởi người thu gom.`
        },
        connection
      )
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  return {
    success: true,
    data: {
      reportId,
      status: 'COMPLETED',
      actualQuantity: qty,
      pointsAwarded,
      completedAt: recordedAt,
      reward: rewardResult
        ? {
          variancePercent: rewardResult.variancePercent,
          penaltyApplied: rewardResult.penaltyApplied,
          isFake: rewardResult.isFake,
          currentLevel: rewardResult.currentLevel,
          reportBlockedUntil: rewardResult.reportBlockedUntil
        }
        : null
    }
  }
}

/**
 * Mark an IN_PROGRESS report as fake.
 *
 * Business behavior:
 *   - Does not require actualQuantity in request
 *   - Automatically records collected quantity as 0
 *   - Automatically sets base points to 0
 *   - Applies fake violation penalties on citizen account
 *
 * @param {string} collectorId
 * @param {string} reportId
 * @param {object} body { quantityUnit, note }
 * @param {Array} files multer file objects (req.files)
 */
async function markReportAsFake(collectorId, reportId, { quantityUnit, note }, files) {
  const user = await userRepository.findById(collectorId)
  if (!user) throw new ApiError(404, 'User account not found')
  if (user.isLocked) throw new ApiError(403, 'Your account is locked. Please contact support.')

  const report = await collectorReportRepository.findReportForComplete(reportId, collectorId)
  if (!report) throw new ApiError(404, 'Report not found')

  if (report.status !== 'IN_PROGRESS') {
    throw new ApiError(400, `Report must be in IN_PROGRESS status to mark fake. Current status: ${report.status}`)
  }

  if (report.assigned_collector_id !== collectorId) {
    throw new ApiError(403, 'You are not the assigned collector for this report')
  }

  const uploadedUrls = []
  if (files && files.length > 0) {
    for (const file of files) {
      const url = await uploadBufferToCloudinary(file.buffer, file.mimetype)
      uploadedUrls.push(url)
    }
  }

  const recordedAt = new Date()
  const collectedRecordId = uuidv4()
  const connection = await db.getConnection()

  let rewardResult = null
  let pointsAwarded = 0

  try {
    await connection.beginTransaction()

    const collectedStatusId = await collectorReportRepository.findStatusTypeIdByName(connection, 'COLLECTED')
    if (!collectedStatusId) throw new Error('COLLECTED status type not found in ReportStatusType table')

    await collectorReportRepository.insertCollectedRecord(connection, {
      collectedRecordId,
      wasteReportId: reportId,
      collectorUserAccountId: collectorId,
      actualQuantityValue: 0,
      quantityUnit: quantityUnit || 'KG',
      note: note ?? 'Báo cáo được người thu gom đánh dấu là giả',
      fileUri: null,
      recordedAt
    })

    for (const url of uploadedUrls) {
      await collectorReportRepository.insertCompletionAttachment(connection, {
        completionAttachmentId: uuidv4(),
        collectedRecordId,
        fileUri: url,
        uploadedAt: recordedAt
      })
    }

    await collectorReportRepository.updateReportStatus(connection, reportId, collectedStatusId)

    await collectorReportRepository.insertStatusHistory(
      connection,
      reportId,
      collectedStatusId,
      collectorId,
      recordedAt
    )

    rewardResult = await rewardService.processForcedFakeViolation(connection, {
      citizenId: report.citizen_id,
      userAccountId: report.citizen_user_account_id,
      wasteReportId: reportId,
      currentTime: recordedAt
    })
    pointsAwarded = rewardResult.finalPoints

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  return {
    success: true,
    data: {
      reportId,
      status: 'COMPLETED',
      actualQuantity: 0,
      pointsAwarded,
      completedAt: recordedAt,
      reward: rewardResult
        ? {
          variancePercent: rewardResult.variancePercent,
          penaltyApplied: rewardResult.penaltyApplied,
          isFake: rewardResult.isFake,
          currentLevel: rewardResult.currentLevel,
          reportBlockedUntil: rewardResult.reportBlockedUntil
        }
        : null
    }
  }
}

// ==================== GET RESULT ====================

/**
 * Return the collected record and images for a completed report.
 *
 * @param {string} collectorId
 * @param {string} reportId
 */
async function getCollectionResult(collectorId, reportId) {
  const user = await userRepository.findById(collectorId)
  if (!user) throw new ApiError(404, 'User account not found')
  if (user.isLocked) throw new ApiError(403, 'Your account is locked. Please contact support.')

  // Verify the report exists and belongs to this collector
  const report = await collectorReportRepository.findReportForResult(reportId)
  if (!report) throw new ApiError(404, 'Report not found')
  if (report.assigned_collector_id !== collectorId) {
    throw new ApiError(403, 'You do not have permission to view this result')
  }

  const result = await collectorReportRepository.findCollectionResult(reportId, collectorId)
  if (!result) {
    throw new ApiError(404, 'No collection result found for this report')
  }

  return {
    success: true,
    data: result
  }
}
