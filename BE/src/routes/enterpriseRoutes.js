const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const enterpriseReportController = require('../controllers/Enterprise/enterpriseReportController');
const enterpriseCollectorController = require('../controllers/Enterprise/enterpriseCollectorController');

const router = express.Router();

// Tới đây prefix sẽ là /enterprise thông qua index.js

// Lấy danh sách Collector available
router.get('/collectors/available', verifyToken, enterpriseCollectorController.getAvailableCollectors);

// ACCEPT report
router.post('/reports/:reportId/accept', verifyToken, enterpriseReportController.acceptReport);

// REJECT report
router.post('/reports/:reportId/reject', verifyToken, enterpriseReportController.rejectReport);

// ASSIGN report
router.post('/reports/:reportId/assign', verifyToken, enterpriseReportController.assignReport);

module.exports = router;
