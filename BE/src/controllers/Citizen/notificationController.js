const notificationService = require('../../services/notificationService')

/**
 * GET /citizen/notifications
 * Returns paginated notifications for the authenticated citizen.
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.sub
    const queryParams = req.query

    const result = await notificationService.getNotifications(userId, queryParams)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /citizen/notifications/:notificationId/read
 * Marks a notification as read for the authenticated citizen.
 */
async function markAsRead(req, res, next) {
  try {
    const userId = req.user.sub
    const { notificationId } = req.params

    const result = await notificationService.markAsRead(userId, notificationId)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /citizen/notifications/read-all
 * Đánh dấu tất cả thông báo là đã đọc
 */
async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.sub
    const result = await notificationService.markAllAsRead(userId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
}
