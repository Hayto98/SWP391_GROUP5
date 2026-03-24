const ApiError = require('../errors/ApiError')
const wasteTypeRepository = require('../repositories/wasteTypeRepository')
const rewardConfigRepository = require('../repositories/rewardConfigRepository')
const enterpriseRepository = require('../repositories/enterpriseRepository')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const userRepository = require('../repositories/userRepository')
const { ROLES } = require('../utils/constants')

const DEFAULT_SALT_ROUNDS = 10

// ==================== WASTE TYPE SERVICES ====================

/**
 * BE-5: Tạo WasteType mới
 * POST /enterprise/waste-types
 *
 * Business Rules:
 * - Tên không được trùng
 * - unitType bắt buộc (không rỗng)
 * - is_active mặc định = true
 */
async function createWasteType({ wasteTypeName, unitType }) {
  // Validate required fields
  if (!wasteTypeName || !wasteTypeName.trim()) {
    throw new ApiError(400, 'wasteTypeName is required')
  }

  if (!unitType) {
    throw new ApiError(400, 'unitType is required')
  }

  // unitType chỉ cần có giá trị, không fix cứng danh sách
  const normalizedUnitType = String(unitType).trim()
  if (!normalizedUnitType) {
    throw new ApiError(400, 'unitType không được để trống')
  }

  // Check unique name
  const existingType = await wasteTypeRepository.findByName(wasteTypeName.trim())
  if (existingType) {
    throw new ApiError(409, 'WasteType với tên này đã tồn tại')
  }

  // Create waste type
  const result = await wasteTypeRepository.createWasteType({
    wasteTypeName: wasteTypeName.trim(),
    unitType: normalizedUnitType
  })

  return {
    success: true,
    data: {
      wasteTypeId: result.wasteTypeId,
      wasteTypeName: result.wasteTypeName,
      unitType: result.unitType
    }
  }
}

/**
 * BE-7: Cập nhật WasteType
 * PUT /enterprise/waste-types/:wasteTypeId
 *
 * Business Rules:
 * - wasteType phải tồn tại
 * - Không cho đổi nếu đang có report ở trạng thái OPEN / ACCEPTED / ASSIGNED
 * - Tên không trùng với wasteType khác
 * - unitType nếu có thì không được rỗng
 * - Không cho update nếu is_active = false (đã inactive)
 */
async function updateWasteType(wasteTypeId, { wasteTypeName, unitType }) {
  // Check existence
  const existingType = await wasteTypeRepository.findById(wasteTypeId)
  if (!existingType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // Check if already inactive
  if (!existingType.isActive) {
    throw new ApiError(400, 'Không thể cập nhật WasteType đã inactive')
  }

  // Check for active reports
  const hasActiveReports = await wasteTypeRepository.hasActiveReports(wasteTypeId)
  if (hasActiveReports) {
    throw new ApiError(400, 'Không thể cập nhật WasteType khi có report đang OPEN / ACCEPTED / ASSIGNED')
  }

  // Validate fields
  const updateData = {}

  if (wasteTypeName !== undefined) {
    if (!wasteTypeName.trim()) {
      throw new ApiError(400, 'wasteTypeName không được để trống')
    }

    // Check unique name (exclude current)
    const duplicateName = await wasteTypeRepository.findByNameExcludeId(wasteTypeName.trim(), wasteTypeId)
    if (duplicateName) {
      throw new ApiError(409, 'WasteType với tên này đã tồn tại')
    }

    updateData.wasteTypeName = wasteTypeName.trim()
  }

  if (unitType !== undefined) {
    const normalizedUnitType = String(unitType).trim()
    if (!normalizedUnitType) {
      throw new ApiError(400, 'unitType không được để trống')
    }
    updateData.unitType = normalizedUnitType
  }

  // Perform update
  const result = await wasteTypeRepository.updateWasteType(wasteTypeId, updateData)

  if (!result) {
    throw new ApiError(400, 'Không có gì để cập nhật')
  }

  return {
    success: true,
    data: {
      wasteTypeId: result.wasteTypeId,
      wasteTypeName: result.wasteTypeName,
      unitType: result.unitType,
      updatedAt: result.updatedAt
    }
  }
}

/**
 * BE-8: Toggle WasteType Active Status
 * PATCH /enterprise/waste-types/:wasteTypeId/status
 *
 * Business Rules:
 * - wasteType phải tồn tại
 * - Nếu hợp lệ → update is_active = isActive
 * - Không tự động thay đổi trạng thái RewardConfig liên quan
 */
async function toggleWasteTypeStatus(wasteTypeId, isActive) {
  // Validate isActive is boolean
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean (true/false)')
  }

  // Check existence
  const existingType = await wasteTypeRepository.findById(wasteTypeId)
  if (!existingType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // Update WasteType active status
  await wasteTypeRepository.setActiveStatus(wasteTypeId, isActive)

  return {
    success: true,
    data: {
      wasteTypeId: wasteTypeId,
      isActive: isActive
    }
  }
}

/**
 * Get all WasteTypes (with optional filtering)
 */
async function getAllWasteTypes({ isActive, unitType, includeInactiveReward } = {}) {
  const filters = {}
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    filters.isActive = isActive === 'true' || isActive === true
  }

  // unitType filter chỉ chấp nhận KG hoặc LON
  if (unitType !== undefined && unitType !== null && unitType !== '') {
    const normalized = String(unitType).trim().toUpperCase()
    if (!['KG', 'LON'].includes(normalized)) {
      throw new ApiError(400, 'unitType chỉ chấp nhận KG hoặc LON')
    }
    filters.unitType = normalized
  }

  // includeInactiveReward default false
  const includeInactive = includeInactiveReward === 'true' || includeInactiveReward === true

  const result = await wasteTypeRepository.findAllWithRewardConfig({
    isActive: filters.isActive,
    unitType: filters.unitType,
    includeInactiveReward: includeInactive
  })

  // Map response to expected shape
  const mapped = result.data.map((wt) => ({
    wasteTypeId: wt.wasteTypeId,
    wasteTypeName: wt.wasteTypeName,
    unitType: wt.unitType,
    isActive: wt.isActive,
    // createdAt intentionally omitted per API spec
    rewardConfig: wt.rewardConfig
      ? {
        rewardConfigId: wt.rewardConfig.rewardConfigId,
        pointsPerUnit: wt.rewardConfig.pointsPerUnit,
        description: wt.rewardConfig.description,
        allowedVariancePercent: wt.rewardConfig.allowedVariancePercent,
        minKgRequired: wt.rewardConfig.minKgRequired,
        maxKgRequired: wt.rewardConfig.maxKgRequired,
        penaltyPercent: wt.rewardConfig.penaltyPercent,
        isActive: wt.rewardConfig.isActive
      }
      : null
  }))

  return {
    success: true,
    data: mapped
  }
}

/**
 * Get WasteType by ID
 */
async function getWasteTypeById(wasteTypeId) {
  // include inactive reward configs? default false — follow same behavior as list
  const wasteType = await wasteTypeRepository.findByIdWithRewardConfig(wasteTypeId, { includeInactiveReward: false })
  if (!wasteType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // If the waste type was soft-deleted, treat as not found for public GET
  if (wasteType.isDeleted) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  return {
    success: true,
    data: {
      wasteTypeId: wasteType.wasteTypeId,
      wasteTypeName: wasteType.wasteTypeName,
      unitType: wasteType.unitType,
      isActive: wasteType.isActive,
      rewardConfig: wasteType.rewardConfig
        ? {
          rewardConfigId: wasteType.rewardConfig.rewardConfigId,
          pointsPerUnit: wasteType.rewardConfig.pointsPerUnit,
          description: wasteType.rewardConfig.description,
          allowedVariancePercent: wasteType.rewardConfig.allowedVariancePercent,
          minKgRequired: wasteType.rewardConfig.minKgRequired,
          maxKgRequired: wasteType.rewardConfig.maxKgRequired,
          penaltyPercent: wasteType.rewardConfig.penaltyPercent,
          isActive: wasteType.rewardConfig.isActive
        }
        : null
    }
  }
}

/**
 * BE-12: Soft delete WasteType
 */
async function deleteWasteType(wasteTypeId) {
  const existingType = await wasteTypeRepository.findById(wasteTypeId)
  if (!existingType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  if (existingType.isDeleted) {
    throw new ApiError(400, 'WasteType đã bị xóa trước đó')
  }

  // Khi xóa, đồng thời tắt active để loại rác không còn được dùng.
  await wasteTypeRepository.setActiveStatus(wasteTypeId, false)

  // Soft delete marker
  await wasteTypeRepository.setSoftDelete(wasteTypeId)

  return {
    success: true,
    message: 'WasteType đã được xóa'
  }
}

// ==================== REWARD CONFIG SERVICES ====================

/**
 * BE-6: Tạo RewardConfig cho WasteType
 * POST /enterprise/reward-config
 *
 * Business Rules:
 * - 1 wasteType chỉ có 1 reward config (unique)
 * - pointsPerUnit > 0
 * - is_active = true
 * - Phù hợp BR-18, BR-58
 */
async function createRewardConfig({
  wasteTypeId,
  pointsPerUnit,
  description,
  allowedVariancePercent,
  minKgRequired,
  maxKgRequired,
  penaltyPercent
}) {
  // Validate required fields
  if (!wasteTypeId) {
    throw new ApiError(400, 'wasteTypeId is required')
  }

  if (pointsPerUnit === undefined || pointsPerUnit === null) {
    throw new ApiError(400, 'pointsPerUnit is required')
  }

  // Validate pointsPerUnit > 0
  const points = Number(pointsPerUnit)
  if (isNaN(points) || points <= 0) {
    throw new ApiError(400, 'pointsPerUnit phải là số dương lớn hơn 0')
  }

  const variance =
    allowedVariancePercent !== undefined && allowedVariancePercent !== null
      ? Number(allowedVariancePercent)
      : 10
  if (isNaN(variance) || variance < 0) {
    throw new ApiError(400, 'allowedVariancePercent phải >= 0')
  }

  const minKg = minKgRequired !== undefined && minKgRequired !== null ? Number(minKgRequired) : 0
  if (isNaN(minKg) || minKg < 0) {
    throw new ApiError(400, 'minKgRequired phải >= 0')
  }

  const maxKg = maxKgRequired !== undefined && maxKgRequired !== null ? Number(maxKgRequired) : 20
  if (isNaN(maxKg) || maxKg < 0) {
    throw new ApiError(400, 'maxKgRequired phải >= 0')
  }

  if (maxKg < minKg) {
    throw new ApiError(400, 'maxKgRequired phải lớn hơn hoặc bằng minKgRequired')
  }

  const penalty = penaltyPercent !== undefined && penaltyPercent !== null ? Number(penaltyPercent) : 0
  if (isNaN(penalty) || penalty < 0) {
    throw new ApiError(400, 'penaltyPercent phải >= 0')
  }

  // Check wasteType exists
  const wasteType = await wasteTypeRepository.findById(wasteTypeId)
  if (!wasteType) {
    throw new ApiError(404, 'WasteType không tồn tại')
  }

  // Check wasteType is active
  if (!wasteType.isActive) {
    throw new ApiError(400, 'Không thể tạo RewardConfig cho WasteType đã inactive')
  }

  // Check unique - 1 wasteType chỉ có 1 reward config
  const existingConfig = await rewardConfigRepository.findByWasteTypeId(wasteTypeId)
  if (existingConfig) {
    throw new ApiError(409, 'WasteType đã có RewardConfig. Mỗi WasteType chỉ có 1 RewardConfig.')
  }

  // Create reward config
  const result = await rewardConfigRepository.createRewardConfig({
    wasteTypeId,
    pointsPerUnit: points,
    description: description || null,
    allowedVariancePercent: variance,
    minKgRequired: minKg,
    maxKgRequired: maxKg,
    penaltyPercent: penalty
  })

  return {
    success: true,
    data: {
      rewardConfigId: result.rewardConfigId,
      wasteTypeId: result.wasteTypeId,
      pointsPerUnit: result.pointsPerUnit,
      allowedVariancePercent: result.allowedVariancePercent,
      penaltyPercent: result.penaltyPercent,
      minKgRequired: result.minKgRequired,
      maxKgRequired: result.maxKgRequired,
      description: result.description,
      isActive: result.isActive === 1 || result.isActive === true,
      createdAt: result.createdAt
    }
  }
}

/**
 * BE-9: Cập nhật RewardConfig
 * PUT /enterprise/reward-config/:rewardConfigId
 *
 * Business Rules:
 * - rewardConfig tồn tại
 * - pointsPerUnit > 0
 * - Không cho update nếu rewardConfig đang inactive
 */
async function updateRewardConfig(
  rewardConfigId,
  { pointsPerUnit, description, allowedVariancePercent, minKgRequired, maxKgRequired, penaltyPercent }
) {
  // Check existence
  const existingConfig = await rewardConfigRepository.findById(rewardConfigId)
  if (!existingConfig) {
    throw new ApiError(404, 'RewardConfig không tồn tại')
  }

  // Check if rewardConfig is active
  if (!existingConfig.isActive) {
    throw new ApiError(400, 'Không thể cập nhật RewardConfig đã inactive')
  }

  const wasteType = await wasteTypeRepository.findById(existingConfig.wasteTypeId)
  if (!wasteType || !wasteType.isActive) {
    throw new ApiError(400, 'Không thể cập nhật RewardConfig khi WasteType đã inactive')
  }

  // Validate and build update data
  const updateData = {}

  if (pointsPerUnit !== undefined) {
    const points = Number(pointsPerUnit)
    if (isNaN(points) || points <= 0) {
      throw new ApiError(400, 'pointsPerUnit phải là số dương lớn hơn 0')
    }
    updateData.pointsPerUnit = points
  }

  if (description !== undefined) {
    updateData.description = description
  }

  if (allowedVariancePercent !== undefined) {
    const val = Number(allowedVariancePercent)
    if (isNaN(val) || val < 0) {
      throw new ApiError(400, 'allowedVariancePercent phải >= 0')
    }
    updateData.allowedVariancePercent = val
  }

  if (penaltyPercent !== undefined) {
    const val = Number(penaltyPercent)
    if (isNaN(val) || val < 0) {
      throw new ApiError(400, 'penaltyPercent phải >= 0')
    }
    updateData.penaltyPercent = val
  }

  if (minKgRequired !== undefined) {
    const val = Number(minKgRequired)
    if (isNaN(val) || val < 0) {
      throw new ApiError(400, 'minKgRequired phải >= 0')
    }
    updateData.minKgRequired = val
  }

  if (maxKgRequired !== undefined) {
    const val = Number(maxKgRequired)
    if (isNaN(val) || val < 0) {
      throw new ApiError(400, 'maxKgRequired phải >= 0')
    }
    updateData.maxKgRequired = val
  }

  const effectiveMin = updateData.minKgRequired !== undefined ? updateData.minKgRequired : Number(existingConfig.minKgRequired)
  const effectiveMax = updateData.maxKgRequired !== undefined ? updateData.maxKgRequired : Number(existingConfig.maxKgRequired)

  if (effectiveMax < effectiveMin) {
    throw new ApiError(400, 'maxKgRequired phải lớn hơn hoặc bằng minKgRequired')
  }

  // Perform update
  const result = await rewardConfigRepository.updateRewardConfig(rewardConfigId, updateData)

  if (!result) {
    throw new ApiError(400, 'Không có gì để cập nhật')
  }

  return {
    success: true,
    data: {
      rewardConfigId: result.rewardConfigId,
      pointsPerUnit: result.pointsPerUnit,
      allowedVariancePercent: result.allowedVariancePercent,
      penaltyPercent: result.penaltyPercent,
      minKgRequired: result.minKgRequired,
      maxKgRequired: result.maxKgRequired,
      updatedAt: new Date().toISOString()
    }
  }
}

/**
 * Get all RewardConfigs (with optional filtering)
 */
async function getAllRewardConfigs({ isActive, page = 1, limit = 20 } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  const filters = {}
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    filters.isActive = isActive === 'true' || isActive === true
  }

  const result = await rewardConfigRepository.findAll({
    isActive: filters.isActive,
    limit: limitNum,
    offset
  })

  const mapped = result.data.map((r) => ({
    reward_config_id: r.rewardConfigId,
    waste_type_id: r.wasteTypeId,
    waste_type_name: r.wasteTypeName,
    unit_type: r.unitType,
    points_per_unit: r.pointsPerUnit,
    description: r.description,
    allowed_variance_percent: r.allowedVariancePercent,
    penalty_percent: r.penaltyPercent,
    min_kg_required: r.minKgRequired,
    max_kg_required: r.maxKgRequired,
    is_active: r.isActive === 1 || r.isActive === true,
    created_at: r.createdAt
  }))

  return {
    success: true,
    data: mapped,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: result.total,
      totalPages: Math.ceil(result.total / limitNum)
    }
  }
}

/**
 * Get RewardConfig by ID
 */
async function getRewardConfigById(rewardConfigId) {
  const config = await rewardConfigRepository.findById(rewardConfigId)
  if (!config) {
    throw new ApiError(404, 'RewardConfig không tồn tại')
  }

  return {
    success: true,
    data: {
      reward_config_id: config.rewardConfigId,
      waste_type_id: config.wasteTypeId,
      points_per_unit: config.pointsPerUnit,
      description: config.description,
      allowed_variance_percent: config.allowedVariancePercent,
      penalty_percent: config.penaltyPercent,
      min_kg_required: config.minKgRequired,
      max_kg_required: config.maxKgRequired,
      is_active: config.isActive === 1 || config.isActive === true,
      created_at: config.createdAt
    }
  }
}

/**
 * Get RewardConfig by WasteType ID
 */
async function getRewardConfigByWasteTypeId(wasteTypeId) {
  const config = await rewardConfigRepository.findByWasteTypeId(wasteTypeId)
  if (!config) {
    throw new ApiError(404, 'RewardConfig không tồn tại cho WasteType này')
  }

  return {
    success: true,
    data: {
      reward_config_id: config.rewardConfigId,
      waste_type_id: config.wasteTypeId,
      points_per_unit: config.pointsPerUnit,
      description: config.description,
      allowed_variance_percent: config.allowedVariancePercent,
      penalty_percent: config.penaltyPercent,
      min_kg_required: config.minKgRequired,
      max_kg_required: config.maxKgRequired,
      is_active: config.isActive === 1 || config.isActive === true,
      created_at: config.createdAt
    }
  }
}

/**
 * GET Dashboard Statistics Enterprise
 */
async function getDashboardStatistics(fromDate, toDate, groupBy = 'day') {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')

  let finalGroupBy = groupBy
  if (finalGroupBy !== 'day' && finalGroupBy !== 'month') {
    finalGroupBy = 'day'
  }

  let startDate = fromDate ? new Date(fromDate) : new Date(now.getFullYear(), now.getMonth(), 1)
  if (isNaN(startDate.getTime())) {
    throw new ApiError(400, 'fromDate không hợp lệ')
  }

  let endDate = toDate ? new Date(toDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (isNaN(endDate.getTime())) {
    throw new ApiError(400, 'toDate không hợp lệ')
  }

  if (startDate >= endDate) {
    throw new ApiError(400, 'fromDate phải nhỏ hơn toDate')
  }

  const maxAllowedDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  if (startDate > now || endDate > maxAllowedDate) {
    throw new ApiError(400, 'Không thể truy vấn dữ liệu trong tương lai')
  }




  const formatDate = (date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const startDateStr = formatDate(startDate)
  const endDateStr = formatDate(endDate)

  const timeFormat = finalGroupBy === 'month' ? '%Y-%m' : '%Y-%m-%d'

  const startOfCurrentMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01 00:00:00`
  let nextMo = now.getMonth() + 2
  let nextMoYr = now.getFullYear()
  if (nextMo > 12) {
    nextMo = 1
    nextMoYr += 1
  }
  const startOfNextMonth = `${nextMoYr}-${pad(nextMo)}-01 00:00:00`

  const data = await enterpriseRepository.getDashboardStatistics(
    startDateStr,
    endDateStr,
    timeFormat,
    startOfCurrentMonth,
    startOfNextMonth
  )

  const parseJson = (val) => {
    if (!val) return null
    try {
      if (typeof val === 'string') return JSON.parse(val)
      return val
    } catch (e) {
      return null
    }
  }

  const statusStats = parseJson(data.statusStats) || {}
  let wasteByType = parseJson(data.wasteByType) || []
  let reportsByTime = parseJson(data.reportsByTime) || []
  const collectorStats = parseJson(data.collectorStats) || {}
  const staffStats = parseJson(data.staffStats) || {}

  if (!Array.isArray(wasteByType)) wasteByType = []
  if (!Array.isArray(reportsByTime)) reportsByTime = []

  return {
    totalReports: Number(statusStats?.totalReports) || 0,
    pendingReports: Number(statusStats?.pendingReports) || 0,
    inProgressReports: Number(statusStats?.inProgressReports) || 0,
    wasteByType: wasteByType.map(w => ({
      wasteType: w?.wasteType || '',
      quantity: Number(w?.quantity) || 0
    })),
    reportsByTime: reportsByTime.map(r => ({
      time: r?.time || '',
      reports: Number(r?.reports) || 0
    })),
    collectorStats: {
      weeklyTasks: Number(collectorStats?.weeklyTasks) || 0,
      monthlyTasks: Number(collectorStats?.monthlyTasks) || 0
    },
    staffStats: {
      totalCollectors: Number(staffStats?.totalCollectors) || 0,
      activeCollectors: Number(staffStats?.activeCollectors) || 0,
      idleCollectors: Number(staffStats?.idleCollectors) || 0
    }
  }
}

// ==================== EMPLOYEE (COLLECTOR) SERVICES ====================

/**
 * Enterprise tạo nhân viên (Collector)
 * POST /enterprise/employees
 *
 * Business Rules:
 * - Role cố định là ROLES.COLLECTOR (3)
 * - Email và phone phải unique
 * - Password bắt buộc
 */
async function createEmployee({ fullname, email, phone, password }) {
  if (!fullname || !email || !phone || !password) {
    throw new ApiError(400, 'fullname, email, phone và password là bắt buộc')
  }

  const existingByEmail = await userRepository.findByEmail(email)
  if (existingByEmail) {
    throw new ApiError(409, 'Email đã được đăng ký')
  }

  const existingByPhone = await userRepository.findByPhone(phone)
  if (existingByPhone) {
    throw new ApiError(409, 'Số điện thoại đã được đăng ký')
  }

  const userAccountId = uuidv4()
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || DEFAULT_SALT_ROUNDS)
  const passwordHash = await bcrypt.hash(password, saltRounds)
  const createdAt = new Date()

  try {
    await userRepository.createUser({
      userAccountId,
      fullname,
      email,
      phone,
      passwordHash,
      roleId: ROLES.COLLECTOR,
      createdAt
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'Email hoặc số điện thoại đã tồn tại')
    }
    throw error
  }

  return {
    userAccountId,
    fullname,
    email,
    phone,
    roleId: ROLES.COLLECTOR,
    createdAt
  }
}

/**
 * Enterprise lấy nhân viên theo ID
 * GET /enterprise/employees/:employeeId
 */
async function getEmployeeById(employeeId) {
  const user = await userRepository.findById(employeeId)
  if (!user) {
    throw new ApiError(404, 'Nhân viên không tồn tại')
  }
  if (user.roleId !== ROLES.COLLECTOR) {
    throw new ApiError(403, 'Không phải tài khoản nhân viên')
  }
  return user
}

/**
 * Enterprise lấy danh sách nhân viên (Collector)
 * GET /enterprise/employees
 */
async function getEmployees({ page = 1, limit = 20, keyword } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  const employees = await userRepository.findAll({
    limit: limitNum,
    offset,
    keyword: keyword?.trim() || undefined,
    roleId: ROLES.COLLECTOR
  })

  const total = await userRepository.countAll({
    keyword: keyword?.trim() || undefined,
    roleId: ROLES.COLLECTOR
  })

  return {
    data: employees,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  }
}

/**
 * Enterprise thống kê công việc của nhân viên (Collector)
 * GET /enterprise/employees/statistics
 */
async function getEmployeeStatistics({ page = 1, limit = 20, month, year } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  const result = await enterpriseRepository.getEmployeeStatistics({
    limit: limitNum,
    offset,
    month,
    year
  })

  // Format data
  const formattedData = result.data.map(emp => ({
    employeeId: emp.employeeId,
    employeeName: emp.employeeName,
    employeeEmail: emp.employeeEmail,
    totalAssigned: Number(emp.totalAssigned) || 0,
    totalCompleted: Number(emp.totalCompleted) || 0,
    totalRejected: Number(emp.totalRejected) || 0,
    completionRate: emp.totalAssigned > 0 
      ? Math.round((Number(emp.totalCompleted) / Number(emp.totalAssigned)) * 100) 
      : 0
  }))

  return {
    data: formattedData,
    total: result.total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(result.total / limitNum)
  }
}

/**
 * Enterprise xóa nhân viên (Collector) — soft delete
 * DELETE /enterprise/employees/:employeeId
 *
 * Business Rules:
 * - Nhân viên phải tồn tại và có roleId = COLLECTOR
 * - Dùng soft delete (is_locked = 1, ban_reason = 'Account deactivated')
 */
async function deleteEmployee(employeeId) {
  const user = await userRepository.findById(employeeId)
  if (!user) {
    throw new ApiError(404, 'Nhân viên không tồn tại')
  }

  if (user.roleId !== ROLES.COLLECTOR) {
    throw new ApiError(403, 'Chỉ có thể xóa tài khoản nhân viên (Collector)')
  }

  await userRepository.softDeleteUser(employeeId)

  return {
    success: true,
    message: 'Nhân viên đã được xóa'
  }
}

module.exports = {
  // WasteType
  createWasteType,
  updateWasteType,
  toggleWasteTypeStatus,
  getAllWasteTypes,
  getWasteTypeById,
  deleteWasteType,

  // RewardConfig
  createRewardConfig,
  updateRewardConfig,
  getAllRewardConfigs,
  getRewardConfigById,
  getRewardConfigByWasteTypeId,
  getDashboardStatistics,

  // Employee
  createEmployee,
  getEmployees,
  getEmployeeById,
  deleteEmployee,
  getEmployeeStatistics
}
