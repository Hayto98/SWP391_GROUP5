const adminService = require('../../services/adminService')
const complaintService = require('../../services/complaintService')

// ==================== READ ====================

/**
 * TASK 1: GET /admin/users - Get all users with filtering and pagination
 * Query params: role, isLocked, emailVerified, keyword, page, limit, createdAtFrom, createdAtTo
 */
async function getAllUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const keyword = req.query.keyword || ''
    const role = req.query.role || ''
    const result = await adminService.getAllUsers({ page, limit, keyword, role })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/users/:id - Get user by ID
 */
async function getUserById(req, res, next) {
  try {
    const result = await adminService.getUserById(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

// ==================== CREATE ====================

/**
 * TASK 2: POST /admin/users - Create new user
 * Request body: { fullname, email, phone, password, role }
 */
async function createUser(req, res, next) {
  try {
    const result = await adminService.createUser(req.body)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

// ==================== UPDATE ====================

/**
 * TASK 3: PUT /admin/users/:id - Update user details
 * Can update: fullname, phone, role, isLocked
 */
async function updateUser(req, res, next) {
  try {
    const adminId = req.user?.sub
    const user = await adminService.updateUser(req.params.id, req.body, adminId)
    res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /admin/users/:id/role - Change user role (deprecated, use PUT instead)
 */
async function changeUserRole(req, res, next) {
  try {
    const adminId = req.user.sub
    const result = await adminService.changeUserRole(req.params.id, req.body.role, adminId)
    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /admin/users/:id/status - Lock/Unlock user (deprecated, use PUT instead)
 */
async function changeUserStatus(req, res, next) {
  try {
    const adminId = req.user.sub
    const result = await adminService.changeUserStatus(req.params.id, req.body.isLocked, adminId)
    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// ==================== DELETE ====================

/**
 * TASK 4: DELETE /admin/users/:id - Soft delete user
 */
async function deleteUser(req, res, next) {
  try {
    const adminId = req.user.sub // Current admin's ID from JWT
    const result = await adminService.deleteUser(req.params.id, adminId)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /admin/report-complaints/:complaintId/resolve
 * Resolve a citizen complaint and optionally refund points.
 */
async function resolveComplaint(req, res, next) {
  try {
    const adminId = req.user?.sub
    const { complaintId } = req.params
    const { adminResponse, refundPoints } = req.body
    const result = await complaintService.resolveComplaint({
      adminId,
      complaintId,
      adminResponse,
      refundPoints: Number(refundPoints) || 0
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserRole,
  changeUserStatus,
  deleteUser,
  resolveComplaint
}
