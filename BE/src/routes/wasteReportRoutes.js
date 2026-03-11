const express = require('express')
const { verifyToken } = require('../middlewares/authMiddleware')
const { uploadSingle } = require('../middlewares/upload')
const wasteReportController = require('../controllers/WasteReport/wasteReportController')

const router = express.Router()

router.post('/', verifyToken, uploadSingle, wasteReportController.createReport)
router.get('/my', verifyToken, wasteReportController.getMyReports)
router.get('/:id', verifyToken, wasteReportController.getReportById)
router.put('/:id', verifyToken, wasteReportController.updateReport)
router.delete('/:id', verifyToken, wasteReportController.deleteReport)

module.exports = router
