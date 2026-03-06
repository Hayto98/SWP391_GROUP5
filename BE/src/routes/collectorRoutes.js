const express = require('express')
const { verifyToken } = require('../middlewares/authMiddleware')
const { requireRole } = require('../middlewares/roleMiddleware')
const { ROLES } = require('../utils/constants')
const collectorReportController = require('../controllers/Collector/collectorReportController')

const router = express.Router()

// ==================== MIDDLEWARE ====================
// Apply authentication and COLLECTOR role check to ALL collector routes
router.use(verifyToken)
router.use(requireRole(ROLES.COLLECTOR))

// ==================== ROUTES ====================
router.get('/reports', collectorReportController.getAssignedReports)
router.get('/reports/:reportId', collectorReportController.getReportById)
router.patch('/reports/:reportId/accept', collectorReportController.acceptReport)

module.exports = router
