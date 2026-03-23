const db = require('../config/database')

/**
 * Repository: Collector Assigned Reports
 *
 * INDEX RECOMMENDATIONS:
 *   ALTER TABLE wastereport ADD INDEX idx_wr_collector_status
 *     (assigned_collector_id, report_status_type_id);
 *   ALTER TABLE reportattachment ADD INDEX idx_ra_report
 *     (waste_report_id);
 *
 * Two-query strategy to avoid N+1 and duplicate rows:
 *   1. Paginated report query with SQL_CALC_FOUND_ROWS
 *   2. Batch image fetch for retrieved report IDs
 *
 * Current status is read directly from wastereport.report_status_type_id
 * joined to reportstatustype. ReportStatusHistory is audit-only and is
 * NOT consulted here. Collector is filtered via wastereport.assigned_collector_id.
 */

/**
 * Find waste reports assigned to a specific collector, with optional filters and pagination.
 *
 * @param {string} collectorId - The user_account_id of the collector
 * @param {object} options - Filter and pagination options
 * @param {string} [options.wasteTypeId] - Exact match on waste_type_id
 * @param {number} options.limit - Number of items per page
 * @param {number} options.offset - Offset for pagination
 * @returns {{ reports: Array, total: number }}
 */
async function findAssignedReports(collectorId, { wasteTypeId, limit, offset }) {
  const ASSIGNED_STATUS_ID = 3
  const COLLECTED_STATUS_ID = 4
  const IN_PROGRESS_STATUS_ID = 6
  limit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10
  offset = Number.isInteger(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0

  let sql = `
      SELECT SQL_CALC_FOUND_ROWS
        wr.waste_report_id,
        wr.report_code    AS reportCode,
        wr.description,
        wr.gps_lat      AS lat,
        wr.gps_lng      AS lng,
        wr.weight,
        wr.created_at,
        wt.waste_type_id   AS wasteTypeId,
        wt.waste_type_name AS wasteTypeName,
        wt.unit_type       AS unitType,
        rst.status_name    AS status
      FROM wastereport wr
      LEFT JOIN (
        SELECT waste_report_id, waste_type_id
        FROM waste_report_item wri1
        WHERE created_at = (
          SELECT MIN(created_at) FROM waste_report_item wri2 WHERE wri1.waste_report_id = wri2.waste_report_id
        )
        LIMIT 1
      ) first_item ON wr.waste_report_id = first_item.waste_report_id
      INNER JOIN wastetype wt
        ON first_item.waste_type_id = wt.waste_type_id
      INNER JOIN reportstatustype rst
        ON wr.report_status_type_id = rst.report_status_type_id
      WHERE wr.report_status_type_id IN (?, ?, ?)
        AND wr.assigned_collector_id = ?
    `

  const params = [ASSIGNED_STATUS_ID, COLLECTED_STATUS_ID, IN_PROGRESS_STATUS_ID, collectorId]

  if (wasteTypeId) {
    sql += ` AND first_item.waste_type_id = ?`
    params.push(Number(wasteTypeId))
  }

  // IMPORTANT: use ? placeholders for LIMIT/OFFSET — do NOT interpolate strings
  sql += ` ORDER BY wr.created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  // Use db.query() for paginated query — db.execute() (server-side prepared stmt)
  // rejects LIMIT/OFFSET params in MySQL 5.7 with "Incorrect arguments to mysqld_stmt_execute"
  // db.query() uses client-side parameterization — still safe from SQL injection
  const [rows] = await db.query(sql, params)

  const [[{ totalCount }]] = await db.query('SELECT FOUND_ROWS() AS totalCount')
  const total = Number(totalCount)

  if (rows.length === 0) {
    return { reports: [], total }
  }

  // ── Batch fetch images ──────────────────────────────────────────────
  const reportIds = rows.map((r) => r.waste_report_id)
  const placeholders = reportIds.map(() => '?').join(', ')

  const [imageRows] = await db.execute(
    `SELECT waste_report_id, file_uri FROM reportattachment WHERE waste_report_id IN (${placeholders})`,
    reportIds
  )

  const imageMap = new Map()
  for (const img of imageRows) {
    if (!imageMap.has(img.waste_report_id)) {
      imageMap.set(img.waste_report_id, [])
    }
    imageMap.get(img.waste_report_id).push({ file_uri: img.file_uri })
  }

  // ── Map to clean DTO ────────────────────────────────────────────────
  const reports = rows.map((row) => ({
    reportId: row.waste_report_id,
    reportCode: row.reportCode || null,
    wasteCode: row.reportCode || row.waste_report_id || null,
    description: row.description || '',
    location: {
      lat: row.lat !== null ? Number(row.lat) : null,
      lng: row.lng !== null ? Number(row.lng) : null
    },
    wasteType: {
      id: row.wasteTypeId,
      name: row.wasteTypeName
    },
    weight: row.weight !== null ? Number(row.weight) : null,
    unitType: row.unitType ?? null,
    reportedAt: row.created_at,
    status: row.status,
    images: imageMap.get(row.waste_report_id) || []
  }))

  return { reports, total }
}

module.exports = {
  findAssignedReports,
  findReportForCollector,
  findImagesByReportId,
  findCollectedRecord,
  findReportById,
  countActiveReports,
  updateReportStatus,
  insertStatusHistory,
  findReportForResult,
  findStatusTypeIdByName,
  insertCollectedRecord,
  insertCollectedItems,
  insertCompletionAttachment,
  findCollectionResult,
  getCollectionStatistics,
  findReportForComplete,
  findRewardConfig,
  insertPointTransaction,
  updateCitizenPoints
}

// ==================== DETAIL BY ID ====================

/**
 * Find a single report by ID only.
 * Returns the full row including assigned_collector_id and status_name.
 * Authorization (collector ownership + status) is checked in the service layer.
 *
 * @param {string} reportId
 * @returns {object|null}
 */
async function findReportForCollector(reportId) {
  const sql = `
    SELECT
      wr.waste_report_id,
      wr.report_code    AS reportCode,
      wr.assigned_collector_id,
      wr.gps_lat      AS lat,
      wr.gps_lng      AS lng,
      wr.weight,
      wr.file_uri     AS report_file_uri,
      wr.description,
      wr.created_at,
      wt.waste_type_id   AS wasteTypeId,
      wt.waste_type_name AS wasteTypeName,
      wt.unit_type       AS unitType,
      rst.status_name    AS status,
      ua.fullname        AS citizenFullname,
      ua.phone           AS citizenPhone,
      cua.fullname       AS collectorFullname,
      cua.phone          AS collectorPhone,
      GROUP_CONCAT(ra.file_uri SEPARATOR '|||') AS citizen_image_uris
    FROM wastereport wr
    LEFT JOIN (
      SELECT waste_report_id, waste_type_id
      FROM waste_report_item wri1
      WHERE created_at = (
        SELECT MIN(created_at) FROM waste_report_item wri2 WHERE wri1.waste_report_id = wri2.waste_report_id
      )
      LIMIT 1
    ) first_item ON wr.waste_report_id = first_item.waste_report_id
    INNER JOIN wastetype wt
      ON first_item.waste_type_id = wt.waste_type_id
    INNER JOIN reportstatustype rst
      ON wr.report_status_type_id = rst.report_status_type_id
    INNER JOIN citizen c
      ON wr.citizen_id = c.citizen_id
    INNER JOIN useraccount ua
      ON c.user_account_id = ua.user_account_id
    LEFT JOIN useraccount cua
      ON wr.assigned_collector_id = cua.user_account_id
    LEFT JOIN reportattachment ra
      ON ra.waste_report_id = wr.waste_report_id
    WHERE wr.waste_report_id = ?
    GROUP BY
      wr.waste_report_id,
      wr.assigned_collector_id,
      lat,
      lng,
      wr.weight,
      report_file_uri,
      wr.description,
      wr.created_at,
      wasteTypeId,
      wasteTypeName,
      unitType,
      status,
      citizenFullname,
      citizenPhone,
      collectorFullname,
      collectorPhone
    `

  const [rows] = await db.execute(sql, [reportId])

  return rows[0] || null
}

/**
 * Get collector completion statistics and optional grouped totals.
 *
 * @param {string} collectorId
 * @param {Date|string|null} fromDate
 * @param {Date|string|null} toDate
 * @param {string} groupBy - one of 'day', 'month', 'year'
 * @returns {{ totalCollectedQuantity: number, totalCompletedTasks: number, grouped: Array<{ period: string, total: number }> }}
 */
async function getCollectionStatistics(collectorId, fromDate, toDate, groupBy = 'day') {
  const allowed = new Set(['day', 'month', 'year'])
  if (!allowed.has(groupBy)) groupBy = 'day'

  let periodFormat
  switch (groupBy) {
    case 'month':
      periodFormat = "%Y-%m"
      break
    case 'year':
      periodFormat = "%Y"
      break
    default:
      periodFormat = "%Y-%m-%d"
  }

  const params = [collectorId]
  let whereClause = ` WHERE collector_user_account_id = ? `

  if (fromDate && toDate) {
    whereClause += ` AND recorded_at BETWEEN ? AND ? `
    params.push(fromDate, toDate)
  } else if (fromDate) {
    whereClause += ` AND recorded_at >= ? `
    params.push(fromDate)
  } else if (toDate) {
    whereClause += ` AND recorded_at <= ? `
    params.push(toDate)
  }

  // Total collected quantity
  const totalSql = `SELECT COALESCE(SUM(actual_quantity_value),0) AS totalCollectedQuantity FROM collectedrecord` + whereClause
  const [totalRows] = await db.execute(totalSql, params)
  const totalCollectedQuantity = Number(totalRows[0].totalCollectedQuantity || 0)

  // Total completed tasks (1 collected record = 1 completed task)
  const totalCompletedTasksSql = `SELECT COUNT(*) AS totalCompletedTasks FROM collectedrecord` + whereClause
  const [countRows] = await db.execute(totalCompletedTasksSql, params)
  const totalCompletedTasks = Number(countRows[0].totalCompletedTasks || 0)

  // Grouped
  const groupSql = `SELECT DATE_FORMAT(recorded_at, '${periodFormat}') AS period, COALESCE(SUM(actual_quantity_value),0) AS total
    FROM collectedrecord` + whereClause + ` GROUP BY period ORDER BY period ASC`

  const [groupRows] = await db.execute(groupSql, params)

  const grouped = groupRows.map((r) => ({ period: r.period, total: Number(r.total) }))

  return { totalCollectedQuantity, totalCompletedTasks, grouped }
}

/**
 * Fetch all images/attachments for a given report.
 *
 * @param {string} reportId
 * @returns {Array<{ file_uri: string }>}
 */
async function findImagesByReportId(reportId) {
  const [rows] = await db.execute(`SELECT file_uri FROM reportattachment WHERE waste_report_id = ?`, [reportId])
  return rows.map((r) => ({ file_uri: r.file_uri }))
}

/**
 * Fetch the collected record for a report by a specific collector.
 *
 * @param {string} reportId
 * @param {string} collectorId
 * @returns {object|null}
 */
async function findCollectedRecord(reportId, collectorId) {
  const [rows] = await db.execute(
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
       AND cr.collector_user_account_id = ?
     GROUP BY
       cr.collected_record_id,
       cr.waste_report_id,
       cr.collector_user_account_id,
       cr.actual_quantity_value,
       cr.quantity_unit,
       cr.recorded_at,
       cr.file_uri,
       cr.note
     LIMIT 1`,
    [reportId, collectorId]
  )

  if (!rows[0]) return null

  const row = rows[0]

  const [itemRows] = await db.execute(
    `SELECT
       ci.collected_item_id,
       ci.waste_type_id,
       wt.waste_type_name,
       wt.unit_type,
       ci.actual_quantity
     FROM collected_item ci
     INNER JOIN wastetype wt ON ci.waste_type_id = wt.waste_type_id
     WHERE ci.collected_record_id = ?`,
    [row.collected_record_id]
  )

  const items = itemRows.map(item => ({
    collectedItemId: item.collected_item_id,
    wasteTypeId: item.waste_type_id,
    wasteTypeName: item.waste_type_name,
    unitType: item.unit_type,
    actualQuantity: Number(item.actual_quantity)
  }))

  return {
    collected_record_id: row.collected_record_id,
    waste_report_id: row.waste_report_id,
    collector_user_account_id: row.collector_user_account_id,
    actual_quantity_value: row.actual_quantity_value,
    quantity_unit: row.quantity_unit,
    recorded_at: row.recorded_at,
    file_uri: row.file_uri,
    note: row.note,
    items,
    completion_images: row.completion_image_uris ? row.completion_image_uris.split('|||') : []
  }
}

// ==================== ACCEPT REPORT ====================

/**
 * Fetch a report's core fields needed for accept authorization.
 *
 * @param {string} reportId
 * @returns {object|null}
 */
async function findReportById(reportId) {
  const [rows] = await db.execute(
    `SELECT waste_report_id, report_status_type_id, assigned_collector_id
     FROM wastereport
     WHERE waste_report_id = ?
     LIMIT 1`,
    [reportId]
  )
  return rows[0] || null
}

/**
 * Count active reports for a collector (status IN 3=ASSIGNED, 6=IN_PROGRESS).
 * Used for BR-42: max 10 active reports per collector.
 *
 * @param {string} collectorId
 * @returns {number}
 */
async function countActiveReports(collectorId) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS activeCount
     FROM wastereport
     WHERE assigned_collector_id = ?
       AND report_status_type_id IN (3, 6)`,
    [collectorId]
  )
  return Number(rows[0].activeCount)
}

/**
 * Update a report's status_type_id using a connection (for use inside transactions).
 *
 * @param {object} connection - mysql2 connection from pool
 * @param {string} reportId
 * @param {number} newStatusId
 */
async function updateReportStatus(connection, reportId, newStatusId) {
  await connection.execute(`UPDATE wastereport SET report_status_type_id = ? WHERE waste_report_id = ?`, [
    newStatusId,
    reportId
  ])
}

/**
 * Insert a record into reportstatushistory using a connection (for use inside transactions).
 *
 * @param {object} connection - mysql2 connection from pool
 * @param {string} reportId
 * @param {number} statusId
 * @param {string} changedByUserId
 * @param {Date} changedAt
 */
async function insertStatusHistory(connection, reportId, statusId, changedByUserId, changedAt) {
  const { v4: uuidv4 } = require('uuid')
  await connection.execute(
    `INSERT INTO reportstatushistory
       (report_status_history_id, waste_report_id, report_status_type_id, changed_by_user_account_id, changed_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), reportId, statusId, changedByUserId, changedAt]
  )
}

// ==================== SUBMIT RESULT ====================

/**
 * Fetch fields required to validate the submit-result action.
 * Returns: waste_report_id, assigned_collector_id, weight (estimated), status (name).
 *
 * @param {string} reportId
 * @returns {object|null}
 */
async function findReportForResult(reportId) {
  const [rows] = await db.execute(
    `SELECT
       wr.waste_report_id,
       wr.assigned_collector_id,
       wr.weight,
       rst.status_name AS status
     FROM wastereport wr
     INNER JOIN reportstatustype rst
       ON wr.report_status_type_id = rst.report_status_type_id
     WHERE wr.waste_report_id = ?
     LIMIT 1`,
    [reportId]
  )
  return rows[0] || null
}

/**
 * Lookup a ReportStatusType ID by its name — avoids hardcoding IDs.
 *
 * @param {object} connection - mysql2 connection
 * @param {string} statusName - e.g. 'COLLECTED'
 * @returns {number|null}
 */
async function findStatusTypeIdByName(connection, statusName) {
  const [rows] = await connection.execute(
    `SELECT report_status_type_id FROM reportstatustype WHERE status_name = ? LIMIT 1`,
    [statusName]
  )
  return rows[0]?.report_status_type_id ?? null
}

/**
 * Insert a new CollectedRecord row (inside a transaction).
 *
 * @param {object} connection - mysql2 connection
 * @param {object} data
 * @param {string} data.collectedRecordId
 * @param {string} data.wasteReportId
 * @param {string} data.collectorUserAccountId
 * @param {number} data.actualQuantityValue
 * @param {string} data.quantityUnit
 * @param {string|null} data.note
 * @param {string|null} data.fileUri
 * @param {Date}   data.recordedAt
 */
async function insertCollectedRecord(
  connection,
  {
    collectedRecordId,
    wasteReportId,
    collectorUserAccountId,
    actualQuantityValue,
    quantityUnit,
    note,
    fileUri,
    recordedAt
  }
) {
  await connection.execute(
    `INSERT INTO collectedrecord
       (collected_record_id, waste_report_id, collector_user_account_id,
        actual_quantity_value, quantity_unit, note, file_uri, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      collectedRecordId,
      wasteReportId,
      collectorUserAccountId,
      actualQuantityValue,
      quantityUnit,
      note ?? null,
      fileUri ?? null,
      recordedAt
    ]
  )
}

/**
 * Insert multiple items into collected_item table (inside a transaction).
 *
 * @param {object} connection - mysql2 connection
 * @param {string} collectedRecordId
 * @param {Array} items - [{ waste_type_id, actual_quantity }]
 */
async function insertCollectedItems(connection, collectedRecordId, items) {
  if (!items || items.length === 0) return

  const { v4: uuidv4 } = require('uuid')
  const values = []
  const placeholders = []

  for (const item of items) {
    placeholders.push('(?, ?, ?, ?)')
    values.push(uuidv4(), collectedRecordId, item.waste_type_id, item.actual_quantity)
  }

  const query = `
    INSERT INTO collected_item
      (collected_item_id, collected_record_id, waste_type_id, actual_quantity)
    VALUES ${placeholders.join(', ')}
  `

  await connection.execute(query, values)
}

// ==================== COMPLETE REPORT ====================

/**
 * Fetch all data needed to validate and process the complete-report action.
 * Joins WasteReport + current status + the collector's CollectedRecord (if any).
 *
 * @param {string} reportId
 * @param {string} collectorId
 * @returns {object|null}
 */
async function findReportForComplete(reportId, collectorId) {
  const [rows] = await db.execute(
    `SELECT
       wr.waste_report_id,
       wr.assigned_collector_id,
       first_item.waste_type_id,
       wr.citizen_id,
       wr.weight,
       c.user_account_id      AS citizen_user_account_id,
       rst.status_name        AS status,
       cr.collected_record_id,
       cr.actual_quantity_value
     FROM wastereport wr
     LEFT JOIN (
       SELECT waste_report_id, waste_type_id
       FROM waste_report_item wri1
       WHERE created_at = (
         SELECT MIN(created_at) FROM waste_report_item wri2 WHERE wri1.waste_report_id = wri2.waste_report_id
       )
       LIMIT 1
     ) first_item ON wr.waste_report_id = first_item.waste_report_id
     INNER JOIN reportstatustype rst
       ON wr.report_status_type_id = rst.report_status_type_id
     INNER JOIN citizen c
       ON wr.citizen_id = c.citizen_id
     LEFT JOIN collectedrecord cr
       ON cr.waste_report_id = wr.waste_report_id
      AND cr.collector_user_account_id = ?
     WHERE wr.waste_report_id = ?
     LIMIT 1`,
    [collectorId, reportId]
  )
  return rows[0] || null
}


/**
 * Fetch active reward config for a waste type.
 * Returns points_per_unit, or null if no active config exists.
 *
 * @param {object} connection - mysql2 connection
 * @param {number} wasteTypeId
 * @returns {object|null}
 */
async function findRewardConfig(connection, wasteTypeId) {
  const [rows] = await connection.execute(
    `SELECT points_per_unit
     FROM rewardconfig
     WHERE waste_type_id = ?
       AND is_active = 1
     LIMIT 1`,
    [wasteTypeId]
  )
  return rows[0] || null
}

/**
 * Insert a PointTransaction record (inside a transaction).
 *
 * @param {object} connection
 * @param {object} data
 * @param {string} data.pointTransactionId
 * @param {string} data.citizenId
 * @param {string} data.wasteReportId
 * @param {number} data.pointsDelta
 * @param {string} data.transactionReason
 * @param {Date}   data.createdAt
 */
async function insertPointTransaction(
  connection,
  { pointTransactionId, citizenId, wasteReportId, pointsDelta, transactionReason, createdAt }
) {
  await connection.execute(
    `INSERT INTO pointtransaction
       (point_transaction_id, citizen_id, waste_report_id,
        points_delta, transaction_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [pointTransactionId, citizenId, wasteReportId, pointsDelta, transactionReason, createdAt]
  )
}

/**
 * Atomically add pointsDelta to Citizen.total_points (inside a transaction).
 *
 * @param {object} connection
 * @param {string} citizenId
 * @param {number} pointsDelta
 */
async function updateCitizenPoints(connection, citizenId, pointsDelta) {
  await connection.execute(
    `UPDATE citizen
     SET total_points = total_points + ?
     WHERE citizen_id = ?`,
    [pointsDelta, citizenId]
  )
}

// ==================== COMPLETION ATTACHMENT ====================

/**
 * Insert a CompletionAttachment row (inside a transaction).
 *
 * @param {object} connection
 * @param {object} data
 * @param {string} data.completionAttachmentId
 * @param {string} data.collectedRecordId
 * @param {string} data.fileUri
 * @param {Date}   data.uploadedAt
 */
async function insertCompletionAttachment(
  connection,
  { completionAttachmentId, collectedRecordId, fileUri, uploadedAt }
) {
  await connection.execute(
    `INSERT INTO completionattachment
       (completion_attachment_id, collected_record_id, file_uri, uploaded_at)
     VALUES (?, ?, ?, ?)`,
    [completionAttachmentId, collectedRecordId, fileUri, uploadedAt]
  )
}

/**
 * Fetch the collection result (collectedrecord + completionattachment images).
 *
 * @param {string} reportId
 * @param {string} collectorId
 * @returns {object|null}
 */
async function findCollectionResult(reportId, collectorId) {
  const [rows] = await db.execute(
    `SELECT
       cr.collected_record_id,
       cr.actual_quantity_value,
       cr.quantity_unit,
       cr.note,
       cr.recorded_at,
       GROUP_CONCAT(ca.file_uri SEPARATOR '|||') AS image_uris
     FROM collectedrecord cr
     LEFT JOIN completionattachment ca
       ON ca.collected_record_id = cr.collected_record_id
     WHERE cr.waste_report_id = ?
       AND cr.collector_user_account_id = ?
     GROUP BY cr.collected_record_id
     LIMIT 1`,
    [reportId, collectorId]
  )
  if (!rows[0]) return null

  const row = rows[0]
  return {
    recordId: row.collected_record_id,
    actualQuantity: Number(row.actual_quantity_value),
    unit: row.quantity_unit,
    note: row.note ?? null,
    recordedAt: row.recorded_at,
    images: row.image_uris ? row.image_uris.split('|||') : []
  }
}
