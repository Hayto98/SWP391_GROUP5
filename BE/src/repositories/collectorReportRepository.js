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
    const ASSIGNED_STATUS_ID = 2
    limit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10
    offset = Number.isInteger(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0

    let sql = `
      SELECT SQL_CALC_FOUND_ROWS
        wr.waste_report_id,
        wr.gps_lat      AS lat,
        wr.gps_lng      AS lng,
        wr.weight,
        wr.created_at,
        wt.waste_type_id   AS wasteTypeId,
        wt.waste_type_name AS wasteTypeName,
        wt.unit_type       AS unitType,
        rst.status_name    AS status
      FROM wastereport wr
      INNER JOIN wastetype wt
        ON wr.waste_type_id = wt.waste_type_id
      INNER JOIN reportstatustype rst
        ON wr.report_status_type_id = rst.report_status_type_id
      WHERE wr.report_status_type_id = ?
        AND wr.assigned_collector_id = ?
    `

    const params = [ASSIGNED_STATUS_ID, collectorId]

    if (wasteTypeId) {
        sql += ` AND wr.waste_type_id = ?`
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
    insertStatusHistory
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
    await connection.execute(
        `UPDATE wastereport SET report_status_type_id = ? WHERE waste_report_id = ?`,
        [newStatusId, reportId]
    )
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
      wr.assigned_collector_id,
      wr.gps_lat      AS lat,
      wr.gps_lng      AS lng,
      wr.weight,
      wr.description,
      wr.created_at,
      wt.waste_type_id   AS wasteTypeId,
      wt.waste_type_name AS wasteTypeName,
      wt.unit_type       AS unitType,
      rst.status_name    AS status,
      ua.fullname        AS citizenFullname,
      ua.phone           AS citizenPhone
    FROM wastereport wr
    INNER JOIN wastetype wt
      ON wr.waste_type_id = wt.waste_type_id
    INNER JOIN reportstatustype rst
      ON wr.report_status_type_id = rst.report_status_type_id
    INNER JOIN citizen c
      ON wr.citizen_id = c.citizen_id
    INNER JOIN useraccount ua
      ON c.user_account_id = ua.user_account_id
    WHERE wr.waste_report_id = ?
    `

    const [rows] = await db.execute(sql, [reportId])

    return rows[0] || null
}

/**
 * Fetch all images/attachments for a given report.
 *
 * @param {string} reportId
 * @returns {Array<{ file_uri: string }>}
 */
async function findImagesByReportId(reportId) {
    const [rows] = await db.execute(`SELECT file_uri FROM ReportAttachment WHERE waste_report_id = ?`, [reportId])
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
        `SELECT actual_quantity_value, quantity_unit, recorded_at
     FROM CollectedRecord
     WHERE waste_report_id = ?
       AND collector_user_account_id = ?
     LIMIT 1`,
        [reportId, collectorId]
    )
    return rows[0] || null
}
