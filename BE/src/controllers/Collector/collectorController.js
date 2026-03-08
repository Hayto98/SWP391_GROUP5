const collectorService = require('../../services/collectorService')

/**
 * PATCH /collector/working-status
 */
async function updateWorkingStatus(req, res, next) {
    try {
        const collectorId = req.user.sub
        const { isWorking } = req.body

        if (isWorking === undefined) {
            return res.status(400).json({ message: 'isWorking field is required' })
        }

        const result = await collectorService.updateWorkingStatus(collectorId, isWorking)
        res.status(200).json(result)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    updateWorkingStatus
}
