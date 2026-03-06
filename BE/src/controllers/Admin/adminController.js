const adminService = require('../../services/adminService')

// ==================== READ ====================

/**
 * GET /admin/users - Get all users with pagination
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
    const user = await adminService.getUserById(req.params.id)
    res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

// ==================== CREATE ====================

/**
 * POST /admin/users - Create new user
 */
async function createUser(req, res, next) {
  try {
    const user = await adminService.createUser(req.body)
    res.status(201).json(user)
  } catch (error) {
    next(error)
  }
}

// ==================== UPDATE ====================

/**
 * PUT /admin/users/:id - Update user details
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
 * PATCH /admin/users/:id/role - Change user role
 */
async function changeUserRole(req, res, next) {
  try {
    const { role } = req.body
    const adminId = req.user.sub // ID of admin performing the action
    const user = await adminService.changeUserRole(req.params.id, role, adminId)
    res.status(200).json({ message: 'Role updated successfully', user })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /admin/users/:id/status - Lock/Unlock user
 */
async function changeUserStatus(req, res, next) {
  try {
    const { status } = req.body
    const adminId = req.user.sub
    const user = await adminService.changeUserStatus(req.params.id, status, adminId)
    res.status(200).json({ message: 'Status updated successfully', user })
  } catch (error) {
    next(error)
  }
}

// ==================== DELETE ====================

/**
 * DELETE /admin/users/:id - Soft delete user
 */
async function deleteUser(req, res, next) {
  try {
    const adminId = req.user.sub
    await adminService.deleteUser(req.params.id, adminId)
    res.status(204).send()
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
  deleteUser
}
