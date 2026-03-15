const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/authMiddleware')
const citizenController = require('../controllers/Citizen/citizenController')
const voucherController = require('../controllers/Citizen/voucherController')

// GET /citizen/me/points
router.get('/me/points', verifyToken, citizenController.getMyPoints)

// GET /citizen/points/history
router.get('/points/history', verifyToken, citizenController.getPointHistory)

// GET /citizen/vouchers/redeemed
router.get('/vouchers/redeemed', verifyToken, voucherController.getRedeemedHistory)

module.exports = router

