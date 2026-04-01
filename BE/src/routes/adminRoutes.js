const express = require('express')
const adminController = require('../controllers/Admin/adminController')
const notificationController = require('../controllers/Admin/notificationController')
const { verifyToken } = require('../middlewares/authMiddleware')
const { requireRole } = require('../middlewares/roleMiddleware')
const { ROLES } = require('../utils/constants')

const router = express.Router()

// ==================== MIDDLEWARE ====================
// Apply authentication to ALL admin routes
router.use(verifyToken)

// Apply ADMIN role check to ALL admin routes
// BR-A05: Only authenticated users with role ADMIN can access /api/v1/admin/*
router.use(requireRole(ROLES.ADMIN))

// ==================== USER CRUD ====================

router.get('/users', adminController.getAllUsers)
router.get('/users/:id', adminController.getUserById)
router.post('/users', adminController.createUser)
router.put('/users/:id', adminController.updateUser)
router.delete('/users/:id', adminController.deleteUser)

// ==================== SPECIAL OPERATIONS ====================
router.patch('/users/:id/role', adminController.changeUserRole)
router.patch('/users/:id/status', adminController.changeUserStatus)

// ==================== COMPLAINT OPERATIONS ====================
router.get('/report-complaints', adminController.getAllComplaints)
router.get('/report-complaints/:complaintId', adminController.getComplaintDetail)
router.put('/report-complaints/:complaintId/resolve', adminController.resolveComplaint)
router.put('/report-complaints/:complaintId/reject', adminController.rejectComplaint)

// ==================== ENTERPRISE OPERATIONS ====================
router.post('/enterprises', adminController.createEnterprise)

// ==================== NOTIFICATIONS ====================
router.get('/notifications', notificationController.getNotifications)
router.patch('/notifications/read-all', notificationController.markAllAsRead)
router.patch('/notifications/:notificationId/read', notificationController.markAsRead)

module.exports = router
