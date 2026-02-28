const wasteTypeService = require('../services/wasteTypeService')

async function getActiveWasteTypes(req, res, next) {
  try {
    const result = await wasteTypeService.getActiveWasteTypes()
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getActiveWasteTypes
}
