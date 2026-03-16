const express = require('express')
<<<<<<< HEAD
const router = express.Router()

const complaintController = require('../controllers/Citizen/complaintController')
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')
const { ROLES } = require('../utils/constants')

// Apply authentication middleware to all routes in this router
router.use(authMiddleware.verifyToken)

// Protect these routes to only be accessible by Citizens
router.use(roleMiddleware.requireRole(ROLES.CITIZEN))

// ======================= COMPLAINTS =======================

// POST /citizen/report-complaints
router.post('/report-complaints', complaintController.createComplaint)

// GET /citizen/report-complaints
router.get('/report-complaints', complaintController.getComplaints)

// GET /citizen/report-complaints/:complaintId
router.get('/report-complaints/:complaintId', complaintController.getComplaintDetail)

// PUT /citizen/report-complaints/:complaintId
router.put('/report-complaints/:complaintId', complaintController.updateComplaint)

// DELETE /citizen/report-complaints/:complaintId
router.delete('/report-complaints/:complaintId', complaintController.deleteComplaint)

module.exports = router
=======
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

module.exports = router

>>>>>>> dev
