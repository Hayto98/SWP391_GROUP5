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

async function getPointHistory(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const { fromDate, toDate, type, page, limit } = req.query
    const result = await citizenService.getPointHistory(userAccountId, { fromDate, toDate, type, page, limit })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

async function getDashboardStatistics(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const citizenId = req.user.citizenId || null
    const { month, year } = req.query

    const result = await citizenService.getDashboardStatistics(userAccountId, citizenId, month, year)
    
    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getMyPoints, getPointHistory, getDashboardStatistics }
