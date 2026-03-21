const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/authMiddleware')
const voucherController = require('../controllers/Citizen/voucherController')

// GET /vouchers
router.get('/', verifyToken, voucherController.listAvailable)
// POST /vouchers/redeem
router.post('/redeem', verifyToken, voucherController.redeem)

module.exports = router
