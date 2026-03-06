const collectorReportRepository = require('../repositories/collectorReportRepository')
const userRepository = require('../repositories/userRepository')
const ApiError = require('../errors/ApiError')

/**
 * Service: Get waste reports assigned to the current collector.
 *
 * Business rules:
 *   - User must not be locked (is_locked = true → 403)
 *   - Only returns reports with status = 'ASSIGNED' and assigned_collector_id = currentUserId
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
  const items = reports

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
  completeReport
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

  // 5️⃣ Fetch images & collected record
  const [images, collectedRecord] = await Promise.all([
    collectorReportRepository.findImagesByReportId(reportId),
    collectorReportRepository.findCollectedRecord(reportId, userId)
  ])

  // 6️⃣ Map DTO (use alias names!)
  return {
    success: true,
    data: {
      reportId: report.waste_report_id,

      citizen: {
        fullname: report.citizenFullname,
        phone: report.citizenPhone
      },

      wasteType: {
        id: report.wasteTypeId,
        name: report.wasteTypeName
      },

      weight: report.weight !== null ? Number(report.weight) : null,

      actualQuantity: collectedRecord ? Number(collectedRecord.actual_quantity_value) : null,

      unitType: report.unitType ?? null,

      location: {
        lat: report.lat !== null ? Number(report.lat) : null,
        lng: report.lng !== null ? Number(report.lng) : null
      },

      images,

      status: report.status
    }
  }
}


// ==================== ACCEPT REPORT ====================

const db = require('../config/database')

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

const { v4: uuidv4 } = require('uuid')

const TOLERANCE_KG = 1

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
 */
async function submitResult(collectorId, reportId, { actualQuantity, note, file_uri }) {
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
      quantityUnit: 'KG',
      note: note ?? null,
      fileUri: file_uri ?? null,
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
 * Complete an IN_PROGRESS report - awards reward points to citizen, transitions to COLLECTED.
 *
 * Business rules:
 *   1. Report must exist (404)
 *   2. Status must be IN_PROGRESS (400)
 *   3. Logged-in user must be the assigned collector (403)
 *   4. CollectedRecord must already exist (result must be submitted first) (400)
 *   5. pointsAwarded = actualQuantity x points_per_unit (0 if no active reward config)
 *
 * Atomic transaction:
 *   INSERT PointTransaction, UPDATE Citizen.total_points,
 *   UPDATE WasteReport status, INSERT ReportStatusHistory
 */
async function completeReport(collectorId, reportId) {
  // 1. Account check
  const user = await userRepository.findById(collectorId)
  if (!user) throw new ApiError(404, 'User account not found')
  if (user.isLocked) throw new ApiError(403, 'Your account is locked. Please contact support.')

  // 2. Fetch report + collected record
  const report = await collectorReportRepository.findReportForComplete(reportId, collectorId)
  if (!report) throw new ApiError(404, 'Report not found')

  // 3. Status must be IN_PROGRESS
  if (report.status !== 'IN_PROGRESS') {
    throw new ApiError(400, `Report must be in IN_PROGRESS status to complete. Current status: ${report.status}`)
  }

  // 4. Must be the assigned collector
  if (report.assigned_collector_id !== collectorId) {
    throw new ApiError(403, 'You are not the assigned collector for this report')
  }

  // 5. CollectedRecord must exist (result submitted first)
  if (!report.collected_record_id) {
    throw new ApiError(400, 'You must submit the collection result (POST /result) before completing the report')
  }

  const actualQuantity = Number(report.actual_quantity_value)
  const completedAt = new Date()
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    // 6. Get reward config
    const rewardConfig = await collectorReportRepository.findRewardConfig(connection, report.waste_type_id)
    const pointsPerUnit = rewardConfig ? Number(rewardConfig.points_per_unit) : 0
    const pointsAwarded = Number((actualQuantity * pointsPerUnit).toFixed(2))

    // 7. Get COLLECTED status ID dynamically
    const collectedStatusId = await collectorReportRepository.findStatusTypeIdByName(connection, 'COLLECTED')
    if (!collectedStatusId) throw new Error('COLLECTED status not found in ReportStatusType table')

    // 8. Insert PointTransaction
    await collectorReportRepository.insertPointTransaction(connection, {
      pointTransactionId: uuidv4(),
      citizenId: report.citizen_id,
      wasteReportId: reportId,
      pointsDelta: pointsAwarded,
      transactionReason: `Reward for waste report ${reportId}`,
      createdAt: completedAt
    })

    // 9. Update Citizen.total_points
    await collectorReportRepository.updateCitizenPoints(connection, report.citizen_id, pointsAwarded)

    // 10. Update WasteReport status to COLLECTED
    await collectorReportRepository.updateReportStatus(connection, reportId, collectedStatusId)

    // 11. Insert ReportStatusHistory
    await collectorReportRepository.insertStatusHistory(connection, reportId, collectedStatusId, collectorId, completedAt)

    await connection.commit()

    return {
      success: true,
      data: {
        reportId,
        status: 'COLLECTED',
        actualQuantity,
        pointsAwarded,
        completedAt
      }
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

