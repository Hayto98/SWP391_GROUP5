const complaintService = require('../../services/complaintService')

async function createComplaint(req, res, next) {
  try {
    const { wasteReportId, complaintReason, attachments } = req.body
    
    // JWT middleware thường gán req.user.sub = userAccountId
    const userAccountId = req.user.sub

    const result = await complaintService.createComplaint({
      userAccountId,
      wasteReportId,
      complaintReason,
      attachments
    })

    res.status(201).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

async function getComplaints(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const query = req.query

    const result = await complaintService.getMyComplaints({
      userAccountId,
      query
    })

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: Math.max(1, parseInt(query.page, 10) || 1),
        limit: Math.max(1, parseInt(query.limit, 10) || 10)
      }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createComplaint,
  getComplaints
}
