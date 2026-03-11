const citizenService = require('../../services/citizenService')

async function getMyPoints(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const result = await citizenService.getMyPoints(userAccountId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = { getMyPoints }
