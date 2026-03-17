const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')
const { ROLES } = require('../utils/constants')

// ==================== CREATE ====================

/**
 * Tạo mới một WasteReport + ghi vào ReportStatusHistory (PENDING).
 *
 * waste_type_id is INT (not UUID). Validates wasteType exists and is active.
 * Uses transaction — rolls back on any error.
 *
 * @param {object} params
 * @param {string} params.citizenId                - citizen_id (UUID)
 * @param {string} params.citizenUserAccountId     - user_account_id of citizen (for history)
 * @param {number} params.wasteTypeId              - waste_type_id (INT)
 * @param {string} params.reportCode               - generated report_code WR-YYYY-NNNN
 * @param {number} params.gpsLat
 * @param {number} params.gpsLng
 * @param {string} params.description
 * @param {number|null} params.weight
 * @param {any} [connection]                       - optional transaction connection
 * @returns {{ wasteReportId: string, status: 'PENDING' }}
 */
async function createReport({
  citizenId,
  citizenUserAccountId,
  wasteTypeId,
  reportCode,
  gpsLat,
  gpsLng,
  description,
  weight,
  fileUri
}, existingConnection = null) {
  const PENDING_STATUS_ID = 1

  // ── 1. Validate wasteType (outside transaction — read-only) ────────
  const [wasteTypeRows] = await db.execute(
    `SELECT waste_type_id FROM wastetype WHERE waste_type_id = ? AND is_active = 1 LIMIT 1`,
    [wasteTypeId]
  )

  if (wasteTypeRows.length === 0) {
    const error = new Error('wasteTypeId không tồn tại hoặc không còn hoạt động.')
    error.code = 'INVALID_WASTE_TYPE'
    throw error
  }

  // ── 2. Generate IDs and timestamp ─────────────────────────────────
  const wasteReportId = uuidv4()
  const statusHistoryId = uuidv4()
  const createdAt = new Date()

  // ── 3. Transaction: insert report + history ────────────────────────
  const connection = existingConnection || await db.getConnection()

  try {
    if (!existingConnection) await connection.beginTransaction()

    await connection.execute(
      `INSERT INTO wastereport
        (waste_report_id, report_code, citizen_id, waste_type_id, report_status_type_id,
         assigned_collector_id, gps_lat, gps_lng, description, weight, file_uri, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
      [
        wasteReportId,
        reportCode,
        citizenId,
        wasteTypeId,
        PENDING_STATUS_ID,
        gpsLat,
        gpsLng,
        description,
        weight ?? 0,
        fileUri || null,
        createdAt
      ]
    )

    await connection.execute(
      `INSERT INTO reportstatushistory
        (report_status_history_id, waste_report_id, report_status_type_id,
         changed_by_user_account_id, changed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [statusHistoryId, wasteReportId, PENDING_STATUS_ID, citizenUserAccountId, createdAt]
    )

    if (!existingConnection) await connection.commit()
  } catch (error) {
    if (!existingConnection) await connection.rollback()
    throw error
  } finally {
    if (!existingConnection) connection.release()
  }

  return {
    wasteReportId,
    reportCode,
    status: 'PENDING',
    createdAt
  }
}

/**
 * Tạo attachment cho WasteReport (lưu vào bảng ReportAttachment)
 */
async function createReportAttachment({ reportAttachmentId, wasteReportId, fileUri, uploadedAt }) {
  await db.execute(
    `INSERT INTO reportattachment
      (report_attachment_id, waste_report_id, file_uri, uploaded_at)
     VALUES (?, ?, ?, ?)`,
    [reportAttachmentId, wasteReportId, fileUri, uploadedAt]
  )
}

// ==================== READ ====================

/**
 * Lấy số sequence tiếp theo cho năm hiện tại để tạo mã WR-YYYY-NNNN
 * Sử dụng INSERT ... ON DUPLICATE KEY UPDATE và LAST_INSERT_ID() để đảm bảo atomic sequence
 */
async function getNextSequence(year) {
  const connection = await db.getConnection()
  try {
    // 1. Thực thi câu lệnh atomic increment
    const incrementQuery = `
      INSERT INTO reportsequence (year, next_val) 
      VALUES (?, LAST_INSERT_ID(1))
      ON DUPLICATE KEY UPDATE 
          next_val = LAST_INSERT_ID(next_val + 1)
    `
    await connection.execute(incrementQuery, [year])

    // 2. Lấy sequence vừa tạo an toàn cho session này
    const [rows] = await connection.execute('SELECT LAST_INSERT_ID() AS sequence_number')
    return rows[0].sequence_number
  } finally {
    connection.release()
  }
}

/**
 * Lấy thông tin báo cáo rác thải bằng reportCode
 */
async function findByReportCode(reportCode) {
  const [rows] = await db.execute('SELECT * FROM wastereport WHERE report_code = ?', [reportCode])
  return rows[0] || null
}

/**
 * Lấy danh sách báo cáo rác của một User công dân (Citizen)
 * Theo yêu cầu SCRUM-14 GET /reports/my
 */
async function findMyReports(citizenId, { fromDate, toDate, status, limit, offset }) {
  // MySQL 5.7 compatible query (No CTEs or Window Functions)
  const normalizedFromDate = Array.isArray(fromDate) ? fromDate[0] : fromDate
  const normalizedToDate = Array.isArray(toDate) ? toDate[0] : toDate
  const normalizedStatus = Array.isArray(status) ? status[0] : status
  const parsedLimit = Number(limit)
  const parsedOffset = Number(offset)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.max(1, Math.trunc(parsedLimit)) : 10
  const safeOffset = Number.isFinite(parsedOffset) ? Math.max(0, Math.trunc(parsedOffset)) : 0

  let selectPart = `
    SELECT SQL_CALC_FOUND_ROWS
      wr.waste_report_id AS waste_report_id,
      wr.report_code AS report_code,
      wr.gps_lat AS gps_lat,
      wr.gps_lng AS gps_lng,
      wr.created_at AS created_at,
      wr.weight AS weight,
      wr.file_uri AS file_uri,
      wr.description AS description,
      
      wt.waste_type_id AS waste_type_id,
      wt.waste_type_name AS waste_type_name,
      wt.unit_type AS unit_type,
      
      c.citizen_id,
      ua_citizen.fullname AS citizen_fullname,
      ua_citizen.phone AS citizen_phone,
      
      rst.status_name AS current_status,
      
      wr.assigned_collector_id AS collector_user_account_id,
      ua_collector.fullname AS collector_fullname,
      ua_collector.phone AS collector_phone,
      
      (
        SELECT fb.feedback_text
        FROM feedback fb
        WHERE fb.waste_report_id = wr.waste_report_id
        ORDER BY fb.created_at DESC
        LIMIT 1
      ) AS reject_reason
      
    FROM wastereport wr
    JOIN citizen c ON wr.citizen_id = c.citizen_id
    JOIN useraccount ua_citizen ON c.user_account_id = ua_citizen.user_account_id
    JOIN wastetype wt ON wr.waste_type_id = wt.waste_type_id
    JOIN reportstatustype rst ON wr.report_status_type_id = rst.report_status_type_id
    LEFT JOIN useraccount ua_collector ON wr.assigned_collector_id = ua_collector.user_account_id
    
    WHERE wr.citizen_id = ?
  `

  const queryParams = [citizenId]

  if (normalizedFromDate !== undefined && normalizedFromDate !== null && String(normalizedFromDate).trim() !== '') {
    selectPart += ` AND wr.created_at >= ?`
    queryParams.push(String(normalizedFromDate).trim())
  }

  if (normalizedToDate !== undefined && normalizedToDate !== null && String(normalizedToDate).trim() !== '') {
    selectPart += ` AND wr.created_at <= ?`
    queryParams.push(String(normalizedToDate).trim())
  }

  // To filter by current_status in MySQL 5.7 without repeating the correlated subquery in the WHERE clause,
  // we filter at the application level after fetching, OR we wrap the query into an outer SELECT.
  // Wrapping the whole query to allow filtering AND pagination accurately:

  let finalQuery = `
    SELECT SQL_CALC_FOUND_ROWS * FROM (${selectPart.replace('SQL_CALC_FOUND_ROWS', '')}) AS DerivedReports 
    WHERE 1=1
  `

  if (normalizedStatus !== undefined && normalizedStatus !== null && String(normalizedStatus).trim() !== '') {
    const statusValue = String(normalizedStatus).trim().toUpperCase()
    if (statusValue === 'OPEN') {
      finalQuery += ` AND (current_status = ? OR current_status IS NULL)`
    } else {
      finalQuery += ` AND current_status = ?`
    }
    queryParams.push(statusValue)
  }

  finalQuery += ` ORDER BY created_at DESC`

  finalQuery += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`

  const safeQueryParams = queryParams.map((value) => {
    if (value === undefined) return null
    return value
  })

  let rows
  try {
    ;[rows] = await db.execute(finalQuery, safeQueryParams)
  } catch (e) {
    console.error('SQL ERROR IN FIND MY REPORTS:', e)
    throw e
  }

  // Lấy tổng số rows cho pagination
  const [countRows] = await db.execute('SELECT FOUND_ROWS() as totalCount')
  const total = countRows[0].totalCount

  const data = rows.map((row) => {
    const attachments = row.file_uri ? [{ fileUri: row.file_uri }] : []

    const statusVal = row.current_status || 'PENDING'

    let assignedCollector = null
    if (statusVal === 'ASSIGNED' || statusVal === 'IN_PROGRESS' || statusVal === 'COLLECTED') {
      if (row.collector_user_account_id) {
        assignedCollector = {
          userAccountId: row.collector_user_account_id,
          fullname: row.collector_fullname,
          phone: row.collector_phone,
          avatar: null
        }
      }
    }

    return {
      wasteReportId: row.waste_report_id,
      reportCode: row.report_code,
      wasteType: {
        id: row.waste_type_id,
        name: row.waste_type_name,
        unitType: row.unit_type
      },
      citizen: {
        fullname: row.citizen_fullname,
        phone: row.citizen_phone
      },
      location: {
        lat: Number(row.gps_lat),
        lng: Number(row.gps_lng)
      },
      description: row.description,
      weight: row.weight !== null && row.weight !== undefined ? Number(row.weight) : null,
      weightKg: row.weight !== null && row.weight !== undefined ? Number(row.weight) : null,
      status: statusVal,
      createdAt: row.created_at,
      attachments: attachments,
      assignedCollector: assignedCollector,
      reason: row.reject_reason || null
    }
  })

  return {
    data,
    total
  }
}

/**
 * Lấy chi tiết 1 báo cáo rác thải
 * Theo yêu cầu SCRUM-14 GET /reports/:id
 */
async function findReportById(reportId) {
  let query = `
    SELECT
      wr.waste_report_id AS waste_report_id,
      wr.report_code AS report_code,
      wr.gps_lat AS gps_lat,
      wr.gps_lng AS gps_lng,
      wr.created_at AS created_at,
      wr.weight AS weight,
      wr.file_uri AS file_uri,
      wr.description AS description,
      
      wt.waste_type_id AS waste_type_id,
      wt.waste_type_name AS waste_type_name,
      wt.unit_type AS unit_type,
      
      c.citizen_id,
      ua_citizen.fullname AS citizen_fullname,
      ua_citizen.phone AS citizen_phone,
      
      rst.status_name AS current_status,
      
      wr.assigned_collector_id AS collector_user_account_id,
      ua_collector.fullname AS collector_fullname,
      ua_collector.phone AS collector_phone,
      wr.scheduled_collect_at AS scheduled_collect_at,
      
      (
        SELECT fb.feedback_text
        FROM feedback fb
        WHERE fb.waste_report_id = wr.waste_report_id
        ORDER BY fb.created_at DESC
        LIMIT 1
      ) AS reject_reason
      
    FROM wastereport wr
    JOIN citizen c ON wr.citizen_id = c.citizen_id
    JOIN useraccount ua_citizen ON c.user_account_id = ua_citizen.user_account_id
    JOIN wastetype wt ON wr.waste_type_id = wt.waste_type_id
    JOIN reportstatustype rst ON wr.report_status_type_id = rst.report_status_type_id
    LEFT JOIN useraccount ua_collector ON wr.assigned_collector_id = ua_collector.user_account_id
    
    WHERE wr.waste_report_id = ?
  `

  const [rows] = await db.execute(query, [reportId])

  if (rows.length === 0) return null

  const row = rows[0]
  const [attachmentRows] = await db.execute(
    `SELECT file_uri, uploaded_at
     FROM reportattachment
     WHERE waste_report_id = ?
     ORDER BY uploaded_at DESC`,
    [reportId]
  )

  const normalizeAttachmentUri = (value) => {
    if (typeof value !== 'string') return null
    const uri = value.trim()
    if (!uri) return null
    return /^https?:\/\//i.test(uri) ? uri : null
  }

  const attachments =
    attachmentRows.length > 0
      ? attachmentRows
        .map((item) => ({
          fileUri: normalizeAttachmentUri(item.file_uri),
          uploadedAt: item.uploaded_at
        }))
        .filter((item) => Boolean(item.fileUri))
        .map((item) => ({
          fileUri: item.fileUri,
          file_uri: item.fileUri,
          uploadedAt: item.uploadedAt
        }))
      : normalizeAttachmentUri(row.file_uri)
        ? [{ fileUri: normalizeAttachmentUri(row.file_uri), file_uri: normalizeAttachmentUri(row.file_uri) }]
        : []

  const [collectedRows] = await db.execute(
    `SELECT
       cr.collected_record_id,
       cr.waste_report_id,
       cr.collector_user_account_id,
       cr.actual_quantity_value,
       cr.quantity_unit,
       cr.recorded_at,
       cr.file_uri,
       cr.note,
       GROUP_CONCAT(ca.file_uri SEPARATOR '|||') AS completion_image_uris
     FROM collectedrecord cr
     LEFT JOIN completionattachment ca
       ON ca.collected_record_id = cr.collected_record_id
     WHERE cr.waste_report_id = ?
     GROUP BY
       cr.collected_record_id,
       cr.waste_report_id,
       cr.collector_user_account_id,
       cr.actual_quantity_value,
       cr.quantity_unit,
       cr.recorded_at,
       cr.file_uri,
       cr.note
     ORDER BY cr.recorded_at DESC
     LIMIT 1`,
    [reportId]
  )

  const collectedRow = collectedRows[0] || null

  const collectorImages = collectedRow
    ? [collectedRow.file_uri, ...(collectedRow.completion_image_uris || '').split('|||')].filter(Boolean)
    : []

  const collectedRecord = collectedRow
    ? {
      collectedRecordId: collectedRow.collected_record_id,
      wasteReportId: collectedRow.waste_report_id,
      collectorUserAccountId: collectedRow.collector_user_account_id,
      actualQuantityValue: Number(collectedRow.actual_quantity_value),
      quantityUnit: collectedRow.quantity_unit,
      recordedAt: collectedRow.recorded_at,
      fileUri: collectedRow.file_uri,
      note: collectedRow.note,
      completionImages: (collectedRow.completion_image_uris || '').split('|||').filter(Boolean)
    }
    : null

  const statusVal = row.current_status || 'PENDING'

  let assignedCollector = null
  if (statusVal === 'ASSIGNED' || statusVal === 'IN_PROGRESS' || statusVal === 'COLLECTED') {
    if (row.collector_user_account_id) {
      assignedCollector = {
        userAccountId: row.collector_user_account_id,
        fullname: row.collector_fullname,
        phone: row.collector_phone,
        avatar: null
      }
    }
  }

  return {
    reportId: row.waste_report_id,
    wasteReportId: row.waste_report_id,
    reportCode: row.report_code,
    citizenId: row.citizen_id, // include to verify ownership later in service
    wasteType: {
      id: row.waste_type_id,
      name: row.waste_type_name,
      unitType: row.unit_type
    },
    citizen: {
      fullname: row.citizen_fullname,
      phone: row.citizen_phone
    },
    location: {
      lat: Number(row.gps_lat),
      lng: Number(row.gps_lng)
    },
    description: row.description,
    weight: row.weight !== null && row.weight !== undefined ? Number(row.weight) : null,
    weightKg: row.weight !== null && row.weight !== undefined ? Number(row.weight) : null,
    actualQuantity: collectedRecord ? Number(collectedRecord.actualQuantityValue) : null,
    unitType: collectedRecord?.quantityUnit || row.unit_type || null,
    status: statusVal,
    createdAt: row.created_at,
    scheduledCollectAt: row.scheduled_collect_at || null,
    attachments: attachments,
    images: attachments.map((item) => ({ file_uri: item.fileUri })),
    assignedCollector: assignedCollector,
    collector: assignedCollector,
    collectorImages,
    collectedRecord,
    reason: row.reject_reason || null
  }
}

/**
 * Cập nhật thông tin báo cáo rác thải
 * Chỉ dùng để cập nhật các trường cơ bản (không ảnh hưởng Status)
 */
async function updateReportById(reportId, updateData) {
  const fields = []
  const values = []

  if (updateData.waste_type_id !== undefined) {
    fields.push('waste_type_id = ?')
    values.push(updateData.waste_type_id)
  }
  if (updateData.gps_lat !== undefined) {
    fields.push('gps_lat = ?')
    values.push(updateData.gps_lat)
  }
  if (updateData.gps_lng !== undefined) {
    fields.push('gps_lng = ?')
    values.push(updateData.gps_lng)
  }
  if (updateData.description !== undefined) {
    fields.push('description = ?')
    values.push(updateData.description)
  }
  if (updateData.weight !== undefined) {
    fields.push('weight = ?')
    values.push(updateData.weight)
  }
  if (updateData.file_uri !== undefined) {
    fields.push('file_uri = ?')
    values.push(updateData.file_uri)
  }

  // Nếu không có field nào cần update thì bypass
  if (fields.length === 0) return true

  const query = `UPDATE wastereport SET ${fields.join(', ')} WHERE waste_report_id = ?`
  values.push(reportId)

  const [result] = await db.execute(query, values)
  return result.affectedRows > 0
}

/**
 * "Xóa" một báo cáo rác thải bằng cách chuyển trạng thái sang REJECTED (ID 5)
 * Ghi lại lịch sử trạng thái và lý do vào bảng Feedback.
 */
async function deleteReportById(reportId, userAccountId) {
  const REJECTED_STATUS_ID = 5
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Cập nhật trạng thái WasteReport thành REJECTED
    const [result] = await connection.execute(
      'UPDATE wastereport SET report_status_type_id = ? WHERE waste_report_id = ?',
      [REJECTED_STATUS_ID, reportId]
    )

    if (result.affectedRows > 0) {
      const historyId = uuidv4()
      const feedbackId = uuidv4()
      const now = new Date()

      // 2. Ghi vào ReportStatusHistory
      await connection.execute(
        `INSERT INTO reportstatushistory
          (report_status_history_id, waste_report_id, report_status_type_id,
           changed_by_user_account_id, changed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [historyId, reportId, REJECTED_STATUS_ID, userAccountId, now]
      )

      // 3. Ghi lý do vào Feedback (theo yêu cầu soft-delete/cancellation)
      // Lấy citizen_id từ report để điền vào feedback
      const [reportRows] = await connection.execute(
        'SELECT citizen_id FROM wastereport WHERE waste_report_id = ?',
        [reportId]
      )
      const citizenId = reportRows[0]?.citizen_id

      await connection.execute(
        `INSERT INTO feedback (feedback_id, waste_report_id, citizen_id, feedback_text, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [feedbackId, reportId, citizenId, 'Báo cáo bị hủy bởi người dùng (Xóa mềm)', now]
      )
    }

    await connection.commit()
    return result.affectedRows > 0
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Lấy danh sách báo cáo bằng userId của UserAccount, do Client thường chỉ có token mang UserAccountId
 */
async function findCitizenIdByUserAccountId(userAccountId) {
  if (!userAccountId) return null
  const [rows] = await db.execute('SELECT citizen_id FROM citizen WHERE user_account_id = ?', [userAccountId])
  return rows[0]?.citizen_id || null
}

async function ensureCitizenIdByUserAccountId(userAccountId) {
  if (!userAccountId) return null
  let citizenId = await findCitizenIdByUserAccountId(userAccountId)
  if (citizenId) return citizenId

  const newCitizenId = uuidv4()
  const createdAt = new Date()

  await db.execute(
    `INSERT INTO citizen (citizen_id, user_account_id, total_points, created_at)
     SELECT ?, ua.user_account_id, 0, ?
       FROM useraccount ua
      WHERE ua.user_account_id = ?
        AND ua.role_id = ?
        AND NOT EXISTS (
          SELECT 1
            FROM citizen c
           WHERE c.user_account_id = ua.user_account_id
        )`,
    [newCitizenId, createdAt, userAccountId, ROLES.CITIZEN]
  )

  citizenId = await findCitizenIdByUserAccountId(userAccountId)
  return citizenId || null
}

/**
 * Lấy tất cả báo cáo rác thải (Enterprise view)
 * Hỗ trợ filter: status, fromDate, toDate + phân trang
 */
async function findAllReports({ status, fromDate, toDate, limit, offset }) {
  const normalizedStatus = Array.isArray(status) ? status[0] : status
  const normalizedFromDate = Array.isArray(fromDate) ? fromDate[0] : fromDate
  const normalizedToDate = Array.isArray(toDate) ? toDate[0] : toDate
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.trunc(Number(limit))) : 10
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Math.trunc(Number(offset))) : 0

  let innerQuery = `
    SELECT
      wr.waste_report_id AS waste_report_id,
      wr.report_code AS report_code,
      wr.gps_lat AS gps_lat,
      wr.gps_lng AS gps_lng,
      wr.created_at AS created_at,
      wr.weight AS weight,
      wr.file_uri AS file_uri,
      wr.description AS description,

      wt.waste_type_id AS waste_type_id,
      wt.waste_type_name AS waste_type_name,
      wt.unit_type AS unit_type,

      c.citizen_id,
      ua_citizen.fullname AS citizen_fullname,
      ua_citizen.phone AS citizen_phone,

      rst.status_name AS current_status,

      wr.assigned_collector_id AS collector_user_account_id,
      ua_collector.fullname AS collector_fullname,
      ua_collector.phone AS collector_phone,

      (
        SELECT fb.feedback_text
        FROM feedback fb
        WHERE fb.waste_report_id = wr.waste_report_id
        ORDER BY fb.created_at DESC
        LIMIT 1
      ) AS reject_reason

    FROM wastereport wr
    JOIN citizen c ON wr.citizen_id = c.citizen_id
    JOIN useraccount ua_citizen ON c.user_account_id = ua_citizen.user_account_id
    JOIN wastetype wt ON wr.waste_type_id = wt.waste_type_id
    JOIN reportstatustype rst ON wr.report_status_type_id = rst.report_status_type_id
    LEFT JOIN useraccount ua_collector ON wr.assigned_collector_id = ua_collector.user_account_id
    WHERE 1=1
  `

  const queryParams = []

  if (normalizedFromDate) {
    innerQuery += ` AND wr.created_at >= ?`
    queryParams.push(String(normalizedFromDate).trim())
  }
  if (normalizedToDate) {
    innerQuery += ` AND wr.created_at <= ?`
    queryParams.push(String(normalizedToDate).trim())
  }

  let finalQuery = `SELECT SQL_CALC_FOUND_ROWS * FROM (${innerQuery}) AS AllReports WHERE 1=1`

  if (normalizedStatus && String(normalizedStatus).trim() !== '') {
    finalQuery += ` AND current_status = ?`
    queryParams.push(String(normalizedStatus).trim().toUpperCase())
  }

  finalQuery += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`

  let rows
  try {
    ;[rows] = await db.execute(finalQuery, queryParams)
  } catch (e) {
    console.error('SQL ERROR IN FIND ALL REPORTS:', e)
    throw e
  }

  const [countRows] = await db.execute('SELECT FOUND_ROWS() as totalCount')
  const total = countRows[0].totalCount

  const data = rows.map((row) => {
    const attachments = row.file_uri ? [{ fileUri: row.file_uri }] : []
    const statusVal = row.current_status || 'PENDING'

    let assignedCollector = null
    if (['ASSIGNED', 'IN_PROGRESS', 'COLLECTED'].includes(statusVal) && row.collector_user_account_id) {
      assignedCollector = {
        userAccountId: row.collector_user_account_id,
        fullname: row.collector_fullname,
        phone: row.collector_phone,
        avatar: null
      }
    }

    return {
      wasteReportId: row.waste_report_id,
      reportCode: row.report_code,
      wasteType: {
        id: row.waste_type_id,
        name: row.waste_type_name,
        unitType: row.unit_type
      },
      citizen: {
        fullname: row.citizen_fullname,
        phone: row.citizen_phone
      },
      location: {
        lat: Number(row.gps_lat),
        lng: Number(row.gps_lng)
      },
      description: row.description,
      status: statusVal,
      createdAt: row.created_at,
      attachments,
      assignedCollector,
      reason: row.reject_reason || null
    }
  })

  return { data, total }
}

/**
 * Update the scheduled collection time for a waste report.
 * Only updates if the report is assigned to the given collector.
 *
 * @param {string} reportId - waste_report_id
 * @param {string} collectorId - assigned_collector_id (user_account_id)
 * @param {string} scheduledCollectAt - ISO datetime string
 * @returns {Promise<boolean>} true if a row was updated
 */
async function updateScheduledCollectAt(reportId, collectorId, scheduledCollectAt) {
  const query = `
    UPDATE wastereport
    SET scheduled_collect_at = ?
    WHERE waste_report_id = ?
      AND assigned_collector_id = ?
  `
  const [result] = await db.execute(query, [scheduledCollectAt, reportId, collectorId])
  return result.affectedRows > 0
}

module.exports = {
  createReport,
  createReportAttachment,
  findMyReports,
  findAllReports,
  findReportById,
  updateReportById,
  deleteReportById,
  findCitizenIdByUserAccountId,
  ensureCitizenIdByUserAccountId,
  getNextSequence,
  findByReportCode,
  updateScheduledCollectAt
}
