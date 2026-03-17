const notificationService = require('../../services/notificationService')

/**
 * GET /enterprise/notifications
 * Returns paginated notifications for the authenticated enterprise.
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
 * PATCH /enterprise/notifications/:notificationId/read
 * Marks a notification as read for the authenticated enterprise.
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
 * PATCH /enterprise/notifications/read-all
 * Marks all notifications as read for the authenticated enterprise.
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
