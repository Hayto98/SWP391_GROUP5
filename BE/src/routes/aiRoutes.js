const express = require('express')
const router = express.Router()
const aiController = require('../controllers/Ai/aiController')
const { verifyToken } = require('../middlewares/authMiddleware')
const { uploadSingle } = require('../middlewares/upload')

// Cần đăng nhập mới gọi được AI
router.use(verifyToken)

/**
 * POST /api/v1/ai/predict-waste
 * Note: Middleware uploadSingle giữ file dưới dạng Buffer trong RAM.
 */
router.post('/predict-waste', uploadSingle, aiController.predictWaste)

module.exports = router

