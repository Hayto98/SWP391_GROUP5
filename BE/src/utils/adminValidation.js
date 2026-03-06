/**
 * Admin User Management Validation Helpers
 * Provides utility functions for validating user data in admin operations
 */

const ApiError = require('../errors/ApiError')

/**
 * Validate email format
 * @param {string} email
 * @throws {ApiError} if email is invalid
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Invalid email format')
  }
}

/**
 * Validate phone number format (accepts 10+ digits)
 * @param {string} phone
 * @throws {ApiError} if phone is invalid
 */
function validatePhone(phone) {
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length < 10) {
    throw new ApiError(400, 'Phone number must have at least 10 digits')
  }
}

/**
 * Validate fullname
 * @param {string} fullname
 * @throws {ApiError} if fullname is invalid
 */
function validateFullname(fullname) {
  if (!fullname || !fullname.trim()) {
    throw new ApiError(400, 'Fullname is required and cannot be empty')
  }
  if (fullname.trim().length < 2) {
    throw new ApiError(400, 'Fullname must be at least 2 characters')
  }
  if (fullname.trim().length > 255) {
    throw new ApiError(400, 'Fullname cannot exceed 255 characters')
  }
}

/**
 * Validate password strength
 * Requires: min 6 chars, at least 1 uppercase, 1 lowercase, 1 number
 * @param {string} password
 * @throws {ApiError} if password is too weak
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters')
  }
  // Optional: Add stronger requirements
  // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
  // if (!passwordRegex.test(password)) {
  //   throw new ApiError(400, 'Password must contain uppercase, lowercase, and numbers')
  // }
}

/**
 * Validate role name
 * @param {string} role - Should be one of: ADMIN, ENTERPRISE, COLLECTOR, CITIZEN
 * @throws {ApiError} if role is invalid
 */
function validateRole(role) {
  const validRoles = ['ADMIN', 'ENTERPRISE', 'COLLECTOR', 'CITIZEN']
  if (!role || !validRoles.includes(role.toUpperCase())) {
    throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`)
  }
}

/**
 * Validate pagination parameters
 * @param {number} page
 * @param {number} limit
 * @returns {Object} { page, limit } with validated values
 */
function validatePagination(page, limit) {
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
  return { page: pageNum, limit: limitNum }
}

/**
 * Validate date range
 * @param {string} fromDate - ISO datetime string
 * @param {string} toDate - ISO datetime string
 * @throws {ApiError} if dates are invalid
 */
function validateDateRange(fromDate, toDate) {
  if (fromDate) {
    const from = new Date(fromDate)
    if (isNaN(from.getTime())) {
      throw new ApiError(400, 'Invalid createdAtFrom date format. Use ISO 8601 format')
    }
  }
  if (toDate) {
    const to = new Date(toDate)
    if (isNaN(to.getTime())) {
      throw new ApiError(400, 'Invalid createdAtTo date format. Use ISO 8601 format')
    }
  }
  if (fromDate && toDate) {
    const from = new Date(fromDate)
    const to = new Date(toDate)
    if (from > to) {
      throw new ApiError(400, 'createdAtFrom must be before createdAtTo')
    }
  }
}

/**
 * Validate create user request body
 * @param {Object} body
 * @throws {ApiError} if validation fails
 */
function validateCreateUserRequest(body) {
  const { fullname, email, phone, password, role } = body

  // Required fields
  if (!fullname) throw new ApiError(400, 'fullname is required')
  if (!email) throw new ApiError(400, 'email is required')
  if (!password) throw new ApiError(400, 'password is required')
  if (!role) throw new ApiError(400, 'role is required')

  // Validate each field
  validateFullname(fullname)
  validateEmail(email)
  validatePasswordStrength(password)
  validateRole(role)

  // Validate phone if provided
  if (phone) {
    validatePhone(phone)
  }
}

/**
 * Validate update user request body
 * @param {Object} body
 * @throws {ApiError} if validation fails
 */
function validateUpdateUserRequest(body) {
  const { fullname, phone, role, isLocked } = body

  // At least one field must be provided
  if (!fullname && !phone && role === undefined && isLocked === undefined) {
    throw new ApiError(400, 'At least one field must be provided for update')
  }

  // Validate each provided field
  if (fullname !== undefined) {
    validateFullname(fullname)
  }
  if (phone !== undefined) {
    validatePhone(phone)
  }
  if (role !== undefined) {
    validateRole(role)
  }
  if (isLocked !== undefined && typeof isLocked !== 'boolean') {
    throw new ApiError(400, 'isLocked must be a boolean')
  }
}

module.exports = {
  validateEmail,
  validatePhone,
  validateFullname,
  validatePasswordStrength,
  validateRole,
  validatePagination,
  validateDateRange,
  validateCreateUserRequest,
  validateUpdateUserRequest
}
