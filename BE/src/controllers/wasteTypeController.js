const wasteTypeService = require('../services/wasteTypeService')

async function getActiveWasteTypes(req, res, next) {
  try {
    const result = await wasteTypeService.getActiveWasteTypes()
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

async function getWasteTypeById(req, res, next) {
  try {
    const result = await wasteTypeService.getWasteTypeById(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getActiveWasteTypes,
  getWasteTypeById
}
