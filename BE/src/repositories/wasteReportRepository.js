const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')
const { ROLES } = require('../utils/constants')

// ==================== CREATE ====================

/**
 * Tạo mới một WasteReport
 */
async function createReport({ wasteReportId, citizenId, wasteTypeId, gpsLat, gpsLng, description, fileUri, createdAt }) {
  await db.execute(
    `INSERT INTO WASTEREPORT
      (waste_report_id, citizen_id, waste_type_id, ai_suggested_waste_type_id, is_duplicate, gps_lat, gps_lng, description, created_at, report_status_type_id, weight, file_uri)
     VALUES (?, ?, ?, NULL, 0, ?, ?, ?, ?, 1, 0.00, ?)`,
    [wasteReportId, citizenId, wasteTypeId, gpsLat, gpsLng, description, createdAt, fileUri || null]
  )
}

// ==================== READ ====================

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
        FROM FEEDBACK fb
        WHERE fb.waste_report_id = wr.waste_report_id
        ORDER BY fb.created_at DESC
        LIMIT 1
      ) AS reject_reason
      
    FROM WASTEREPORT wr
    JOIN CITIZEN c ON wr.citizen_id = c.citizen_id
    JOIN USERACCOUNT ua_citizen ON c.user_account_id = ua_citizen.user_account_id
    JOIN WASTETYPE wt ON wr.waste_type_id = wt.waste_type_id
    JOIN REPORTSTATUSTYPE rst ON wr.report_status_type_id = rst.report_status_type_id
    LEFT JOIN USERACCOUNT ua_collector ON wr.assigned_collector_id = ua_collector.user_account_id
    
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

  let rows;
  try {
      [rows] = await db.execute(finalQuery, safeQueryParams)
  } catch(e) {
      console.error("SQL ERROR IN FIND MY REPORTS:", e);
      throw e;
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
        FROM FEEDBACK fb
        WHERE fb.waste_report_id = wr.waste_report_id
        ORDER BY fb.created_at DESC
        LIMIT 1
      ) AS reject_reason
      
    FROM WASTEREPORT wr
    JOIN CITIZEN c ON wr.citizen_id = c.citizen_id
    JOIN USERACCOUNT ua_citizen ON c.user_account_id = ua_citizen.user_account_id
    JOIN WASTETYPE wt ON wr.waste_type_id = wt.waste_type_id
    JOIN REPORTSTATUSTYPE rst ON wr.report_status_type_id = rst.report_status_type_id
    LEFT JOIN USERACCOUNT ua_collector ON wr.assigned_collector_id = ua_collector.user_account_id
    
    WHERE wr.waste_report_id = ?
  `

  const [rows] = await db.execute(query, [reportId])

  if (rows.length === 0) return null

  const row = rows[0]
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
    status: statusVal,
    createdAt: row.created_at,
    attachments: attachments,
    assignedCollector: assignedCollector,
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

  const query = `UPDATE WASTEREPORT SET ${fields.join(', ')} WHERE waste_report_id = ?`
  values.push(reportId)

  const [result] = await db.execute(query, values)
  return result.affectedRows > 0
}

/**
 * Xóa một báo cáo rác thải
 * Yêu cầu xóa các bảng phụ có khóa ngoại trỏ tới WasteReport trước
 */
async function deleteReportById(reportId) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Xóa CollectedRecord (nếu có - do seed script lúc nãy có gắn)
    await connection.execute('DELETE FROM COLLECTEDRECORD WHERE waste_report_id = ?', [reportId])

    // 2. Xóa ReportStatusHistory
    await connection.execute('DELETE FROM REPORTSTATUSHISTORY WHERE waste_report_id = ?', [reportId])

    // 4. Xóa bảng cha WasteReport
    const [result] = await connection.execute('DELETE FROM WASTEREPORT WHERE waste_report_id = ?', [reportId])

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
  const [rows] = await db.execute('SELECT citizen_id FROM CITIZEN WHERE user_account_id = ?', [userAccountId])
  return rows[0]?.citizen_id || null
}

async function ensureCitizenIdByUserAccountId(userAccountId) {
  if (!userAccountId) return null
  let citizenId = await findCitizenIdByUserAccountId(userAccountId)
  if (citizenId) return citizenId

  const newCitizenId = uuidv4()
  const createdAt = new Date()

  await db.execute(
    `INSERT INTO CITIZEN (citizen_id, user_account_id, total_points, created_at)
     SELECT ?, ua.user_account_id, 0, ?
       FROM USERACCOUNT ua
      WHERE ua.user_account_id = ?
        AND ua.role_id = ?
        AND NOT EXISTS (
          SELECT 1
            FROM CITIZEN c
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
        FROM FEEDBACK fb
        WHERE fb.waste_report_id = wr.waste_report_id
        ORDER BY fb.created_at DESC
        LIMIT 1
      ) AS reject_reason

    FROM WASTEREPORT wr
    JOIN CITIZEN c ON wr.citizen_id = c.citizen_id
    JOIN USERACCOUNT ua_citizen ON c.user_account_id = ua_citizen.user_account_id
    JOIN WASTETYPE wt ON wr.waste_type_id = wt.waste_type_id
    JOIN REPORTSTATUSTYPE rst ON wr.report_status_type_id = rst.report_status_type_id
    LEFT JOIN USERACCOUNT ua_collector ON wr.assigned_collector_id = ua_collector.user_account_id
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

module.exports = {
  createReport,
  findMyReports,
  findAllReports,
  findReportById,
  updateReportById,
  deleteReportById,
  findCitizenIdByUserAccountId,
  ensureCitizenIdByUserAccountId
}
