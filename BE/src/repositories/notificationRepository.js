const db = require('../config/database')

/**
 * Repository: Notification
 *
 * Handles CRUD operations on the `notification` table.
 */

/**
 * Insert a new notification row.
 * Accepts an optional connection for transactional use (e.g. inside completeReport).
 * Falls back to pool when connection is null.
 *
 * @param {object|null} connection - mysql2 connection (for transactions) or null
 * @param {object} data
 * @param {string} data.notificationId
 * @param {string} data.notificationType
 * @param {string} data.recipientUserAccountId
 * @param {string|null} data.wasteReportId
 * @param {string} data.message
 */
async function create(connection, { notificationId, notificationType, recipientUserAccountId, wasteReportId, message }) {
  const executor = connection || db

  await executor.execute(
    `INSERT INTO notification
       (notification_id, notification_type, recipient_user_account_id,
        waste_report_id, message, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, NOW())`,
    [notificationId, notificationType, recipientUserAccountId, wasteReportId ?? null, message]
  )
}

/**
 * Find notifications for a specific user, ordered by created_at DESC.
 *
 * @param {string} userId - recipient_user_account_id
 * @param {object} options
 * @param {number} options.limit
 * @param {number} options.offset
 * @returns {{ notifications: Array, total: number }}
 */
async function findByRecipientUserId(userId, { limit, offset }) {
  const sql = `
    SELECT SQL_CALC_FOUND_ROWS
      notification_id,
      notification_type,
      recipient_user_account_id,
      waste_report_id,
      message,
      is_read,
      created_at
    FROM notification
    WHERE recipient_user_account_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `

  const [rows] = await db.query(sql, [userId, limit, offset])

  const [[{ totalCount }]] = await db.query('SELECT FOUND_ROWS() AS totalCount')
  const total = Number(totalCount)

  return { notifications: rows, total }
}

/**
 * Find a single notification by its ID.
 *
 * @param {string} notificationId
 * @returns {object|null}
 */
async function findById(notificationId) {
  const [rows] = await db.execute(
    `SELECT
       notification_id,
       notification_type,
       recipient_user_account_id,
       waste_report_id,
       message,
       is_read,
       created_at
     FROM notification
     WHERE notification_id = ?
     LIMIT 1`,
    [notificationId]
  )
  return rows[0] || null
}

/**
 * Mark a notification as read (is_read = 1).
 *
 * @param {string} notificationId
 * @returns {boolean} true if a row was updated
 */
async function markAsRead(notificationId) {
  const [result] = await db.execute(
    `UPDATE notification SET is_read = 1 WHERE notification_id = ?`,
    [notificationId]
  )
  return result.affectedRows > 0
}

/**
 * Find the citizen's user_account_id from a waste report.
 * Joins: wastereport → citizen → useraccount.
 *
 * @param {string} reportId - waste_report_id
 * @returns {string|null} user_account_id of the citizen
 */
async function findCitizenUserAccountIdByReportId(reportId) {
  const [rows] = await db.execute(
    `SELECT ua.user_account_id
     FROM wastereport wr
     INNER JOIN citizen c ON wr.citizen_id = c.citizen_id
     INNER JOIN useraccount ua ON c.user_account_id = ua.user_account_id
     WHERE wr.waste_report_id = ?
     LIMIT 1`,
    [reportId]
  )
  return rows[0]?.user_account_id ?? null
}

module.exports = {
  create,
  findByRecipientUserId,
  findById,
  markAsRead,
  findCitizenUserAccountIdByReportId
}
