const express = require('express')
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

module.exports = router
