const express = require('express')
const { verifyToken } = require('../middlewares/authMiddleware')
const { requireRole } = require('../middlewares/roleMiddleware')
const { ROLES } = require('../utils/constants')
const notificationController = require('../controllers/Citizen/notificationController')

const router = express.Router()

// ==================== MIDDLEWARE ====================
// Apply authentication and CITIZEN role check to ALL citizen routes
router.use(verifyToken)
router.use(requireRole(ROLES.CITIZEN))

// ==================== ROUTES ====================
router.get('/notifications', notificationController.getNotifications)
router.patch('/notifications/:notificationId/read', notificationController.markAsRead)

module.exports = router
