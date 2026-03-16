const express = require('express')
const { verifyToken } = require('../middlewares/authMiddleware')
const { requireRole } = require('../middlewares/roleMiddleware')
const { ROLES } = require('../utils/constants')
const notificationController = require('../controllers/Citizen/notificationController')
const citizenController = require('../controllers/Citizen/citizenController')
const voucherController = require('../controllers/Citizen/voucherController')
const router = express.Router()

// ==================== MIDDLEWARE ====================
// Apply authentication and CITIZEN role check to ALL citizen routes
router.use(verifyToken)
router.use(requireRole(ROLES.CITIZEN))

// ==================== ROUTES ====================
router.get('/notifications', notificationController.getNotifications)
router.patch('/notifications/:notificationId/read', notificationController.markAsRead)
// GET /citizen/me/points
router.get('/me/points', citizenController.getMyPoints)

// GET /citizen/points/history
router.get('/points/history', citizenController.getPointHistory)

// GET /citizen/vouchers/redeemed
router.get('/vouchers/redeemed', voucherController.getRedeemedHistory)

router.post('/vouchers/redeem', voucherController.redeem)
module.exports = router
