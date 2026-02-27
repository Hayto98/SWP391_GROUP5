const express = require('express')
const { verifyToken } = require('../middlewares/authMiddleware')
const wasteReportController = require('../controllers/WasteReport/wasteReportController')

const router = express.Router()

router.get('/my', verifyToken, wasteReportController.getMyReports)
router.get('/:id', verifyToken, wasteReportController.getReportById)
router.put('/:id', verifyToken, wasteReportController.updateReport)
router.delete('/:id', verifyToken, wasteReportController.deleteReport)

module.exports = router
