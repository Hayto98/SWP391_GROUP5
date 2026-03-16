const express = require('express')
const router = express.Router()

const { verifyToken } = require('../middlewares/authMiddleware')
const { requireRole } = require('../middlewares/roleMiddleware')
const { ROLES } = require('../utils/constants')

const complaintController = require('../controllers/Citizen/complaintController')
const notificationController = require('../controllers/Citizen/notificationController')
const citizenController = require('../controllers/Citizen/citizenController')
const voucherController = require('../controllers/Citizen/voucherController')

// ==================== MIDDLEWARE ====================
// Apply authentication and CITIZEN role check to ALL citizen routes
router.use(verifyToken)
router.use(requireRole(ROLES.CITIZEN))

// ==================== ROUTES ====================

// --- COMPLAINTS ---
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

// --- NOTIFICATIONS ---
router.get('/notifications', notificationController.getNotifications)
router.patch('/notifications/:notificationId/read', notificationController.markAsRead)

// --- CITIZEN INFO ---
// GET /citizen/me/points
router.get('/me/points', citizenController.getMyPoints)

// GET /citizen/points/history
router.get('/points/history', citizenController.getPointHistory)

// --- VOUCHERS ---
// GET /citizen/vouchers/redeemed
router.get('/vouchers/redeemed', voucherController.getRedeemedHistory)

module.exports = router
