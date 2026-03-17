const db = require('../config/database')

/**
 * Repository: Notification
 *
 * Handles CRUD operations on the `notification` table.
 */

/**
 * Insert a new notification row.
 */
async function create(connection, { notificationId, notificationType, recipientUserAccountId, wasteReportId, message }) {
  const executor = connection || db

  await executor.execute(
    `INSERT INTO notification
       (NOTIFICATION_ID, notification_type, RECIPIENT_USER_ACCOUNT_ID,
        WASTE_REPORT_ID, MESSAGE, is_read, CREATED_AT)
     VALUES (?, ?, ?, ?, ?, 0, NOW())`,
    [notificationId, notificationType, recipientUserAccountId, wasteReportId ?? null, message]
  )
}

/**
 * Find notifications for a specific user, ordered by created_at DESC.
 */
async function findByRecipientUserId(userId, { limit, offset }) {
  const sql = `
    SELECT SQL_CALC_FOUND_ROWS
      NOTIFICATION_ID AS notification_id,
      notification_type,
      RECIPIENT_USER_ACCOUNT_ID AS recipient_user_account_id,
      WASTE_REPORT_ID AS waste_report_id,
      MESSAGE AS message,
      is_read,
      CREATED_AT AS created_at
    FROM notification
    WHERE LOWER(RECIPIENT_USER_ACCOUNT_ID) = LOWER(?)
    ORDER BY CREATED_AT DESC
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
/**
 * Find a single notification by its ID.
 */
async function findById(notificationId) {
  const [rows] = await db.execute(
    `SELECT
       NOTIFICATION_ID AS notification_id,
       notification_type,
       RECIPIENT_USER_ACCOUNT_ID AS recipient_user_account_id,
       WASTE_REPORT_ID AS waste_report_id,
       MESSAGE AS message,
       is_read,
       CREATED_AT AS created_at
     FROM notification
     WHERE LOWER(NOTIFICATION_ID) = LOWER(?)
     LIMIT 1`,
    [notificationId]
  )
  return rows[0] || null
}

/**
 * Mark a notification as read (is_read = 1).
 */
async function markAsRead(notificationId) {
  const [result] = await db.execute(
    `UPDATE notification SET is_read = 1 WHERE LOWER(NOTIFICATION_ID) = LOWER(?)`,
    [notificationId]
  )
  return result.affectedRows > 0
}

/**
 * Find the citizen's user_account_id from a waste report.
 */
async function findCitizenUserAccountIdByReportId(reportId) {
  const [rows] = await db.execute(
    `SELECT ua.USER_ACCOUNT_ID AS user_account_id
     FROM wastereport wr
     INNER JOIN citizen c ON wr.citizen_id = c.citizen_id
     INNER JOIN useraccount ua ON c.user_account_id = ua.USER_ACCOUNT_ID
     WHERE wr.waste_report_id = ?
     LIMIT 1`,
    [reportId]
  )
  return rows[0]?.user_account_id ?? null
}

/**
 * Mark all notifications for a user as read.
 */
async function markAllAsReadByUserId(userId) {
  await db.execute(
    `UPDATE notification SET is_read = 1 WHERE LOWER(RECIPIENT_USER_ACCOUNT_ID) = LOWER(?)`,
    [userId]
  )
}

module.exports = {
  create,
  findByRecipientUserId,
  findById,
  markAsRead,
  markAllAsReadByUserId,
  findCitizenUserAccountIdByReportId
}
