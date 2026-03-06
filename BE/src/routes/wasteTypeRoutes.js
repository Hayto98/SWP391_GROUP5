const express = require('express')
const wasteTypeController = require('../controllers/wasteTypeController')

const router = express.Router()

// GET /waste-types — danh sách loại rác active kèm điểm thưởng
router.get('/', wasteTypeController.getActiveWasteTypes)
router.get('/:id', wasteTypeController.getWasteTypeById)

module.exports = router
