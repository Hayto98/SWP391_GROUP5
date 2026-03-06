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
  getReportById
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

module.exports = {
  getAssignedReports,
  getReportById,
  acceptAssignedReport
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
