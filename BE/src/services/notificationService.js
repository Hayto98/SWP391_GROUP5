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

  console.log(`[DEBUG] Fetching notifications for userId: ${userId}`);
  const { notifications, total } = await notificationRepository.findByRecipientUserId(userId, { limit, offset })
  console.log(`[DEBUG] Found ${notifications.length} notifications. Total: ${total}`);

  const data = notifications.map((row) => {
    // Handle both lowercase and uppercase keys due to inconsistent DB collation
    return {
      notificationId: row.notification_id || row.NOTIFICATION_ID,
      type: row.notification_type || row.NOTIFICATION_TYPE,
      message: row.message || row.MESSAGE,
      isRead: (row.is_read ?? row.IS_READ) === 1,
      wasteReportId: row.waste_report_id || row.WASTE_REPORT_ID || null,
      createdAt: row.created_at || row.CREATED_AT
    };
  })

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

  const recipientId = notification.recipient_user_account_id || notification.RECIPIENT_USER_ACCOUNT_ID;
  if (recipientId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this notification')
  }

  const id = notification.notification_id || notification.NOTIFICATION_ID;
  await notificationRepository.markAsRead(id)

  return {
    success: true,
    message: 'Notification marked as read'
  }
}

/**
 * Mark all notifications for a user as read.
 */
async function markAllAsRead(userId) {
  await notificationRepository.markAllAsReadByUserId(userId)
  return {
    success: true,
    message: 'All notifications marked as read'
  }
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
}
