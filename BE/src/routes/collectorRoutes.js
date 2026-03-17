const express = require('express')
const { verifyToken } = require('../middlewares/authMiddleware')
const { requireRole } = require('../middlewares/roleMiddleware')
const { ROLES } = require('../utils/constants')
const { uploadMultiple, uploadSingle } = require('../middlewares/upload')
const collectorReportController = require('../controllers/Collector/collectorReportController')
const collectorController = require('../controllers/Collector/collectorController')
const notificationController = require('../controllers/Collector/notificationController')

const router = express.Router()

// ==================== SMART UPLOAD MIDDLEWARE ====================
// Runs multer only for multipart/form-data (image upload).
// For JSON/urlencoded requests the body is already parsed by express.json();
// forcing multer would reset req.body to {}.
function smartUploadComplete(req, res, next) {
  const ct = req.headers['content-type'] || ''
  if (ct.includes('multipart/form-data')) {
    return uploadMultiple(req, res, next)
  }
  req.files = []
  return next()
}

// ==================== MIDDLEWARE ====================
// Apply authentication and COLLECTOR role check to ALL collector routes
router.use(verifyToken)
router.use(requireRole(ROLES.COLLECTOR))

// ==================== ROUTES ====================
router.get('/working-status', collectorController.getWorkingStatus)
router.patch('/working-status', collectorController.updateWorkingStatus)
router.get('/reports', collectorReportController.getAssignedReports)
router.get('/reports/:reportId', collectorReportController.getReportById)
router.get('/reports/:reportId/result', collectorReportController.getResult)
router.patch('/reports/:reportId/accept', collectorReportController.acceptReport)
router.post('/reports/:reportId/result', uploadSingle, collectorReportController.submitResult)
router.post('/reports/:reportId/complete', smartUploadComplete, collectorReportController.completeReport)
router.patch('/reports/:reportId/schedule', collectorReportController.scheduleCollection)

// --- NOTIFICATIONS ---
router.get('/notifications', notificationController.getNotifications)
router.patch('/notifications/:notificationId/read', notificationController.markAsRead)

module.exports = router
