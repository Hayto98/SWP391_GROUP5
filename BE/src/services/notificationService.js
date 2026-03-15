const { v4: uuidv4 } = require('uuid')
const notificationRepository = require('../repositories/notificationRepository')
const ApiError = require('../errors/ApiError')
const { NOTIFICATION_TYPES } = require('../utils/constants')

/**
 * Service: Notification
 *
 * Handles notification creation, retrieval, and marking as read.
 */

// Build a Set of valid notification types for O(1) lookup
const VALID_TYPES = new Set(Object.values(NOTIFICATION_TYPES))

/**
 * Create a new notification.
 *
 * @param {object} data
 * @param {string} data.notificationType - Must match NOTIFICATION_TYPES enum
 * @param {string} data.recipientUserAccountId
 * @param {string|null} data.wasteReportId
 * @param {string} data.message
 * @param {object|null} [connection] - Optional DB connection for transactional use
 */
async function createNotification({ notificationType, recipientUserAccountId, wasteReportId, message }, connection = null) {
  if (!VALID_TYPES.has(notificationType)) {
    throw new ApiError(400, `Invalid notification type: ${notificationType}`)
  }

  const notificationId = uuidv4()

  await notificationRepository.create(connection, {
    notificationId,
    notificationType,
    recipientUserAccountId,
    wasteReportId: wasteReportId ?? null,
    message
  })

  return { notificationId }
}

/**
 * Get paginated notifications for a citizen.
 *
 * @param {string} userId - The authenticated user's user_account_id
 * @param {object} queryParams - { page, limit }
 * @returns {object} Standardized response
 */
async function getNotifications(userId, queryParams) {
  const page = Math.max(1, Number(queryParams.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(queryParams.limit) || 20))
  const offset = (page - 1) * limit

  const { notifications, total } = await notificationRepository.findByRecipientUserId(userId, { limit, offset })

  const data = notifications.map((row) => ({
    notificationId: row.notification_id,
    type: row.notification_type,
    message: row.message,
    isRead: row.is_read === 1,
    wasteReportId: row.waste_report_id ?? null,
    createdAt: row.created_at
  }))

  return {
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total
      }
    }
  }
}

/**
 * Mark a notification as read.
 * Enforces that only the recipient can mark their own notification.
 *
 * @param {string} userId - The authenticated user's user_account_id
 * @param {string} notificationId
 * @returns {object} Standardized response
 */
async function markAsRead(userId, notificationId) {
  const notification = await notificationRepository.findById(notificationId)

  if (!notification) {
    throw new ApiError(404, 'Notification not found')
  }

  // Authorization: only the recipient can mark their notification as read
  if (notification.recipient_user_account_id !== userId) {
    throw new ApiError(403, 'You do not have permission to access this notification')
  }

  await notificationRepository.markAsRead(notificationId)

  return {
    success: true,
    message: 'Notification marked as read'
  }
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead
}
