const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/authMiddleware')
const citizenController = require('../controllers/Citizen/citizenController')

// GET /citizen/me/points
router.get('/me/points', verifyToken, citizenController.getMyPoints)

module.exports = router

