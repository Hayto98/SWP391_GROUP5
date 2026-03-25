const citizenRepository = require('../repositories/citizenRepository')
const userRepository = require('../repositories/userRepository')
const ApiError = require('../errors/ApiError')
const { ROLES } = require('../utils/constants')

function toMySqlDateTime(value, { endOfDay = false, fieldName = 'date' } = {}) {
  if (!value) return undefined

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value} ${endOfDay ? '23:59:59' : '00:00:00'}`
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `Invalid ${fieldName}`)
  }

  return parsed.toISOString().slice(0, 19).replace('T', ' ')
}

async function getMyPoints(userAccountId) {
  const user = await userRepository.findById(userAccountId)
  if (!user) {
    throw new ApiError(404, 'Citizen not found')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Account is locked')
  }

  if (user.roleId !== ROLES.CITIZEN) {
    throw new ApiError(403, 'User is not a citizen')
  }

  const citizen = await citizenRepository.findByUserAccountId(userAccountId)
  if (!citizen) {
    throw new ApiError(404, 'Citizen record not found')
  }

  return {
    success: true,
    data: {
      citizenId: citizen.citizenId,
      totalPoints: Number(citizen.totalPoints) || 0
    }
  }
}

async function getPointHistory(userAccountId, { fromDate, toDate, type, page, limit } = {}) {
  const user = await userRepository.findById(userAccountId)
  if (!user) {
    throw new ApiError(404, 'Citizen not found')
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Account is locked')
  }

  if (user.roleId !== ROLES.CITIZEN) {
    throw new ApiError(403, 'User is not a citizen')
  }

  const citizen = await citizenRepository.findByUserAccountId(userAccountId)
  if (!citizen) {
    throw new ApiError(404, 'Citizen record not found')
  }

  const requestedType = typeof type === 'string' && type.trim() ? type.trim().toUpperCase() : undefined
  if (requestedType && requestedType !== 'EARN' && requestedType !== 'REDEEM' && requestedType !== 'ALL') {
    throw new ApiError(400, 'type must be EARN, REDEEM or ALL')
  }

  // Keep compatibility with clients sending type=EARN for full history view.
  const normalizedType = requestedType === 'REDEEM' ? 'REDEEM' : undefined

  const normalizedFromDate = toMySqlDateTime(fromDate, { fieldName: 'fromDate' })
  const normalizedToDate = toMySqlDateTime(toDate, { endOfDay: true, fieldName: 'toDate' })

  if (normalizedFromDate && normalizedToDate && normalizedFromDate > normalizedToDate) {
    throw new ApiError(400, 'fromDate must be before or equal to toDate')
  }

  const p = Math.max(1, Number(page) || 1)
  const l = Math.max(1, Math.min(100, Number(limit) || 20))

  const rows = await citizenRepository.findPointTransactions(citizen.citizenId, {
    fromDate: normalizedFromDate,
    toDate: normalizedToDate,
    type: normalizedType,
    page: p,
    limit: l
  })

  return {
    success: true,
    data: rows.map(r => ({
      transactionId: r.transactionId,
      wasteReportId: r.wasteReportId || null,
      type: r.type,
      points: Number(r.points),
      reason: r.reason,
      createdAt: r.createdAt
    }))
  }
}

async function getDashboardStatistics(userAccountId, citizenIdFromToken, month, year) {
  let citizenId = citizenIdFromToken;

  if (citizenId && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(citizenId)) {
    throw new ApiError(400, 'Định dạng ID người dùng không hợp lệ');
  }

  const user = await userRepository.findById(userAccountId);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  if (user.isLocked) {
    throw new ApiError(403, 'Tài khoản đã bị khóa');
  }

  if (user.roleId !== ROLES.CITIZEN) {
    throw new ApiError(403, 'Người dùng không phải Citizen');
  }

  const citizen = await citizenRepository.findByUserAccountId(userAccountId);
  if (!citizen) {
    throw new ApiError(404, 'Không tìm thấy hồ sơ công dân');
  }

  if (citizenId && citizenId !== citizen.citizenId) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  citizenId = citizen.citizenId;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const queryYear = year !== undefined ? parseInt(year, 10) : currentYear;
  const queryMonth = month !== undefined ? parseInt(month, 10) : currentMonth;

  if (isNaN(queryYear) || queryYear < 2000) {
    throw new ApiError(400, 'Năm không hợp lệ');
  }

  if (isNaN(queryMonth) || queryMonth < 1 || queryMonth > 12) {
    throw new ApiError(400, 'Tháng không hợp lệ (1–12)');
  }

  if (queryYear > currentYear || (queryYear === currentYear && queryMonth > currentMonth)) {
    throw new ApiError(400, 'Không thể xem dữ liệu');
  }

  if (currentYear - queryYear > 5) {
    throw new ApiError(400, 'Chỉ có thể tra cứu dữ liệu trong khoảng 5 năm gần đây');
  }

  const pad = (n) => String(n).padStart(2, '0');
  const startStr = `${queryYear}-${pad(queryMonth)}-01 00:00:00`;

  let nextMonth = queryMonth + 1;
  let nextMonthYear = queryYear;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextMonthYear += 1;
  }
  const endStr = `${nextMonthYear}-${pad(nextMonth)}-01 00:00:00`;

  const data = await citizenRepository.getDashboardStatistics(citizenId, startStr, endStr);

  const totalPoints = Number(data?.totalPoints) || 0;

  let parsedDailyStats = [];
  try {
    if (data?.dailyStats) {
      parsedDailyStats = typeof data.dailyStats === 'string'
        ? JSON.parse(data.dailyStats)
        : data.dailyStats;
    }
  } catch (error) {
    parsedDailyStats = [];
  }

  if (!Array.isArray(parsedDailyStats)) {
    parsedDailyStats = [];
  }

  let totalReports = 0;
  let completedReports = 0;
  let rejectedReports = 0;

  const reportsByDay = parsedDailyStats.map(day => {
    const dailyRep = Number(day?.reports) || 0;
    const dailyComp = Number(day?.completed) || 0;
    const dailyRej = Number(day?.rejected) || 0;

    totalReports += dailyRep;
    completedReports += dailyComp;
    rejectedReports += dailyRej;

    return {
      date: day?.date || '',
      reports: dailyRep
    };
  });

  const completionRate = totalReports > 0 ? (completedReports / totalReports) : 0;

  return {
    totalReports,
    totalPoints,
    completedReports,
    rejectedReports,
    completionRate,
    reportsByDay
  };
}


module.exports = { getMyPoints, getPointHistory, getDashboardStatistics }
