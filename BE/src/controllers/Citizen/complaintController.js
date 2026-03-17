const complaintService = require('../../services/complaintService')

async function createComplaint(req, res, next) {
  try {
    const { wasteReportId, complaintReason, attachments, fileUri } = req.body
    const fileBuffer = req.file ? req.file.buffer : null
    const fileMimetype = req.file ? req.file.mimetype : null

    // JWT middleware thường gán req.user.sub = userAccountId
    const userAccountId = req.user.sub

    const result = await complaintService.createComplaint({
      userAccountId,
      wasteReportId,
      complaintReason,
      attachments,
      fileBuffer,
      fileMimetype,
      fileUriFromBody: fileUri || null
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

async function getComplaintDetail(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const { complaintId } = req.params

    const result = await complaintService.getComplaintDetail({
      userAccountId,
      complaintId
    })

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

async function updateComplaint(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const { complaintId } = req.params
    const { complaintReason, attachments } = req.body

    await complaintService.updateComplaint({
      userAccountId,
      complaintId,
      complaintReason,
      attachments
    })

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully'
    })
  } catch (error) {
    next(error)
  }
}

async function deleteComplaint(req, res, next) {
  try {
    const userAccountId = req.user.sub
    const { complaintId } = req.params

    await complaintService.softDeleteComplaint({
      userAccountId,
      complaintId
    })

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintDetail,
  updateComplaint,
  deleteComplaint
}
