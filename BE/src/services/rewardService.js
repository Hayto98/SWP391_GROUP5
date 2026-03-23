const { v4: uuidv4 } = require('uuid')
const rewardRepository = require('../repositories/rewardRepository')
const notificationService = require('./notificationService')
const { NOTIFICATION_TYPES } = require('../utils/constants')
const ApiError = require('../errors/ApiError')

/**
 * Service: Reward
 *
 * Implements the 10-step reward calculation process:
 *   STEP 0: Cooldown check
 *   STEP 1: Validate minimum weight
 *   STEP 2: Cap maximum weight
 *   STEP 3: Calculate base points
 *   STEP 4: Calculate variance
 *   STEP 5: Detect fake report
 *   STEP 6: Reward & penalty calculation
 *   STEP 7: Update violations (if fake)
 *   STEP 8: Determine violation level
 *   STEP 9: Apply escalating penalties
 */

/**
 * Determine violation level from total violation count.
 *
 * @param {number} total
 * @returns {number} 0-4
 */
function getViolationLevel(total) {
  if (total >= 8) return 4
  if (total >= 6) return 3
  if (total >= 4) return 2
  if (total >= 2) return 1
  return 0
}

/**
 * Apply penalty if the citizen's violation level escalated.
 *
 * @param {object} connection
 * @param {object} params
 * @param {string} params.citizenId
 * @param {string} params.userAccountId
 * @param {string} params.wasteReportId (optional)
 * @param {number} params.currentLevel
 * @param {number} params.lastPenaltyLevel
 * @param {Date} params.currentTime
 * @returns {object} { lastPenaltyLevel, reportBlockedUntil } updated values
 */
async function applyPenaltyIfLevelEscalated(
  connection,
  { citizenId, userAccountId, wasteReportId, currentLevel, lastPenaltyLevel, currentTime, penaltyPercent = 5 }
) {
  let reportBlockedUntil = null

  if (currentLevel > lastPenaltyLevel) {
    if (currentLevel === 1) {
      // Warning notification
      await notificationService.createNotification(
        {
          notificationType: NOTIFICATION_TYPES.VIOLATION_WARNING,
          recipientUserAccountId: userAccountId,
          wasteReportId: wasteReportId || null,
          message: 'Bạn đã nhận cảnh báo do hoạt động bất thường'
        },
        connection
      )
    }

    if (currentLevel === 2) {
      // Lấy số điểm hiện tại của citizen
      const [rows] = await connection.execute('SELECT total_points FROM citizen WHERE citizen_id = ?', [citizenId])
      const currentPoints = rows.length > 0 && rows[0].total_points ? Number(rows[0].total_points) : 0
      // Trừ % số điểm hiện tại
      const PENALTY_PERCENT = penaltyPercent
      let deduction = Math.floor(currentPoints * (PENALTY_PERCENT / 100))
      if (deduction < 1 && currentPoints > 0) deduction = 1 // Phạt tối thiểu 1 điểm nếu có điểm
      if (currentPoints === 0) deduction = 0

      if (deduction > 0) {
        await rewardRepository.insertPointTransaction(connection, {
          pointTransactionId: uuidv4(),
          citizenId,
          wasteReportId: wasteReportId || null,
          pointsDelta: -deduction,
          transactionReason: `Phạt do vi phạm quy định (${PENALTY_PERCENT}%)`,
          createdAt: currentTime
        })
        await rewardRepository.updateCitizenPoints(connection, citizenId, -deduction)

        await notificationService.createNotification(
          {
            notificationType: NOTIFICATION_TYPES.POINT_DEDUCTED,
            recipientUserAccountId: userAccountId,
            wasteReportId: wasteReportId || null,
            message: `Bạn đã bị trừ ${deduction} điểm do vi phạm`
          },
          connection
        )
      }
    }

    if (currentLevel === 3) {
      // Block report creation for 24 hours
      reportBlockedUntil = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000)

      await notificationService.createNotification(
        {
          notificationType: NOTIFICATION_TYPES.REPORT_BLOCKED,
          recipientUserAccountId: userAccountId,
          wasteReportId: wasteReportId || null,
          message: 'Bạn bị tạm khóa tạo báo cáo trong 24 giờ'
        },
        connection
      )
    }

    if (currentLevel === 4) {
      if (!userAccountId) {
        console.warn('[applyPenaltyIfLevelEscalated] userAccountId is missing — skipping account lock')
      } else {
        // Lock the user account
        await rewardRepository.lockUserAccount(connection, userAccountId)

        await notificationService.createNotification(
          {
            notificationType: NOTIFICATION_TYPES.ACCOUNT_LOCKED,
            recipientUserAccountId: userAccountId,
            wasteReportId: wasteReportId || null,
            message: 'Tài khoản của bạn đã bị khóa do vi phạm nhiều lần'
          },
          connection
        )
      }

      // Don't return early here, just let it fall through
    }

    // Return the updated penalty level so we don't repeatedly penalize
    return {
      lastPenaltyLevel: currentLevel,
      reportBlockedUntil
    }
  }

  // If level didn't escalate, return the unchanged values
  return {
    lastPenaltyLevel,
    reportBlockedUntil
  }
}

// ═══════════════════════════════════════════════════════════════════
// DUPLICATE REPORT DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculates distance in meters between two coordinates.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity
  const R = 6371e3 // Earth radius in meters
  const toRad = Math.PI / 180
  const phi1 = lat1 * toRad
  const phi2 = lat2 * toRad
  const deltaPhi = (lat2 - lat1) * toRad
  const deltaLambda = (lon2 - lon1) * toRad

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function normalizeDescription(desc) {
  if (!desc) return ''
  return String(desc).toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Detect duplicate reports and handle spam violation.
 *
 * @param {object} connection - mysql2 connection (active transaction)
 * @param {object} params
 * @param {string} params.citizenId
 * @param {number} params.gpsLat
 * @param {number} params.gpsLng
 * @param {string} params.description
 * @param {string} params.fileUri
 * @param {Date} params.currentTime
 * @returns {object} { isDuplicate, duplicateCount, message }
 */
async function checkDuplicateAndHandleSpam(
  connection,
  { citizenId, gpsLat, gpsLng, description, fileUri, currentTime }
) {
  const [citizens] = await connection.execute(
    `SELECT citizen_id, user_account_id, spam_violation_count, total_violation_count, 
            last_violation_at, last_penalty_level, report_blocked_until 
     FROM citizen 
     WHERE citizen_id = ? 
     FOR UPDATE`,
    [citizenId]
  )

  if (citizens.length === 0) {
    throw new ApiError(404, 'Citizen not found')
  }

  const citizen = citizens[0]

  if (citizen.is_locked === 1) {
    throw new ApiError(403, 'Tài khoản của bạn đã bị khóa. Không thể thực hiện hành động này.')
  }

  const thirtyMinsAgo = new Date(currentTime.getTime() - 30 * 60 * 1000)

  const [recentReports] = await connection.execute(
    `SELECT gps_lat, gps_lng, description, file_uri 
     FROM wastereport 
     WHERE citizen_id = ? 
       AND created_at >= ? 
       AND report_status_type_id NOT IN (4, 5)`,
    [citizenId, thirtyMinsAgo]
  )

  const normalizedNewDesc = normalizeDescription(description)

  let duplicateCount = 0

  for (const report of recentReports) {
    const distance = calculateDistance(gpsLat, gpsLng, report.gps_lat, report.gps_lng)

    const normalizedExistingDesc = normalizeDescription(report.description)
    const isDescriptionIdentical = normalizedNewDesc !== '' && normalizedNewDesc === normalizedExistingDesc
    const isFileIdentical = fileUri != null && fileUri !== '' && fileUri === report.file_uri

    if (distance <= 50 || isDescriptionIdentical || isFileIdentical) {
      duplicateCount++
    }
  }

  let isDuplicate = false
  let message = null

  if (duplicateCount >= 1) {
    isDuplicate = true
    message = 'Báo cáo này bị trùng'

    const newSpamCount = (citizen.spam_violation_count || 0) + 1
    const newTotalCount = (citizen.total_violation_count || 0) + 1

    const currentLevel = getViolationLevel(newTotalCount)

    // Apply penalty if level escalated
    const penaltyResult = await applyPenaltyIfLevelEscalated(connection, {
      citizenId,
      userAccountId: citizen.user_account_id,
      wasteReportId: null, // duplicate spam check happens before report is created
      currentLevel,
      lastPenaltyLevel: citizen.last_penalty_level || 0,
      currentTime
    })

    await connection.execute(
      `UPDATE citizen 
       SET spam_violation_count = ?, 
           total_violation_count = ?, 
           last_violation_at = ?,
           last_penalty_level = ?,
           report_blocked_until = ?
       WHERE citizen_id = ?`,
      [
        newSpamCount,
        newTotalCount,
        currentTime,
        penaltyResult.lastPenaltyLevel,
        penaltyResult.reportBlockedUntil || citizen.report_blocked_until,
        citizenId
      ]
    )
  }

  return {
    isDuplicate,
    duplicateCount,
    message
  }
}

// ═══════════════════════════════════════════════════════════════════
// STEP 0.5: SPAM PREVENTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Check for spam behavior before processing a waste report.
 * Must be called INSIDE a transaction (connection is passed in).
 *
 * Rule 1: Rate limit — max 1 report per 10 minutes
 * Rule 2: Daily limit — max 5 reports per day (exceeding = spam violation)
 *
 * @param {object} connection - mysql2 connection (active transaction)
 * @param {object} params
 * @param {string} params.citizenId
 * @param {Date}   params.currentTime
 * @returns {object} { allowed, isSpam, message?, spamViolationCount, totalViolationCount, lastViolationAt }
 */
async function checkSpam(connection, { citizenId, currentTime }) {
  // Fetch citizen data (with FOR UPDATE lock)
  const citizen = await rewardRepository.findCitizenForReward(connection, citizenId)
  if (!citizen) {
    throw new ApiError(404, 'Citizen not found')
  }

  // Double check blocked status first
  if (citizen.isLocked === 1) {
    return {
      allowed: false,
      isSpam: false,
      message: 'Tài khoản của bạn đã bị khóa. Không thể thực hiện hành động này.',
      spamViolationCount: citizen.spamViolationCount,
      totalViolationCount: citizen.totalViolationCount,
      lastViolationAt: citizen.lastViolationAt
    }
  }

  if (citizen.reportBlockedUntil && currentTime < new Date(citizen.reportBlockedUntil)) {
    return {
      allowed: false,
      isSpam: false,
      message: 'Bạn đang bị tạm khóa và không thể tạo báo cáo mới',
      spamViolationCount: citizen.spamViolationCount,
      totalViolationCount: citizen.totalViolationCount,
      lastViolationAt: citizen.lastViolationAt
    }
  }

  let spamViolationCount = citizen.spamViolationCount
  let totalViolationCount = citizen.totalViolationCount
  let lastViolationAt = citizen.lastViolationAt

  // ── Rule 1: Rate limit (10 minutes per report) ───────────────────
  // const lastReportTime = await rewardRepository.findLastReportTime(connection, citizenId)
  // if (lastReportTime) {
  //   const diffMs = currentTime.getTime() - new Date(lastReportTime).getTime()
  //   const diffMinutes = diffMs / (1000 * 60)
  //   if (diffMinutes < 10) {
  //     return {
  //       allowed: false,
  //       isSpam: false,
  //       message: 'Bạn chỉ có thể tạo báo cáo mỗi 10 phút',
  //       spamViolationCount,
  //       totalViolationCount,
  //       lastViolationAt
  //     }
  //   }
  // }

  // ── Rule 2: Daily limit (max 5 reports per day) ──────────────────
  const totalReportsToday = await rewardRepository.countReportsToday(connection, citizenId, currentTime)
  if (totalReportsToday >= 5) {
    spamViolationCount += 1
    totalViolationCount += 1
    lastViolationAt = currentTime

    const currentLevel = getViolationLevel(totalViolationCount)

    const penaltyResult = await applyPenaltyIfLevelEscalated(connection, {
      citizenId,
      userAccountId: citizen.userAccountId,
      wasteReportId: null,
      currentLevel,
      lastPenaltyLevel: citizen.lastPenaltyLevel || 0,
      currentTime
    })

    // Persist spam violation
    await rewardRepository.updateCitizenSpamViolation(connection, citizenId, {
      spamViolationCount,
      totalViolationCount,
      lastViolationAt,
      lastPenaltyLevel: penaltyResult.lastPenaltyLevel,
      reportBlockedUntil: penaltyResult.reportBlockedUntil || citizen.reportBlockedUntil
    })

    return {
      allowed: true,
      isSpam: true,
      message: 'Bạn đã vượt quá số lần báo cáo trong ngày',
      spamViolationCount,
      totalViolationCount,
      lastViolationAt
    }
  }

  // ── Default: no spam ─────────────────────────────────────────────
  return {
    allowed: true,
    isSpam: false,
    spamViolationCount,
    totalViolationCount,
    lastViolationAt
  }
}

/**
 * Process reward for a completed waste report.
 * This function must be called INSIDE a transaction (connection is passed in).
 *
 * @param {object} connection - mysql2 connection (active transaction)
 * @param {object} params
 * @param {string} params.citizenId
 * @param {string} params.userAccountId - citizen's user_account_id
 * @param {string} params.wasteReportId
 * @param {number} params.citizenReportKg - weight reported by citizen
 * @param {number} params.collectorActualKg - weight measured by collector
 * @param {Date}   params.currentTime
 * @param {string|number} params.wasteTypeId
 * @returns {object} Result with final_points, variance_percent, etc.
 */
async function processReward(
  connection,
  { citizenId, userAccountId, wasteReportId, citizenReportKg, collectorActualKg, currentTime, wasteTypeId }
) {
  // ── Fetch citizen data (with FOR UPDATE lock) ──────────────────────
  const citizen = await rewardRepository.findCitizenForReward(connection, citizenId)
  if (!citizen) {
    throw new ApiError(404, 'Citizen not found')
  }

  // ── Fetch reward config ────────────────────────────────────────────
  const config = await rewardRepository.findRewardConfigByWasteType(connection, wasteTypeId)
  if (!config) {
    // No active reward config → award 0 points silently
    return {
      finalPoints: 0,
      variancePercent: 0,
      penaltyApplied: false,
      isFake: false,
      currentLevel: getViolationLevel(citizen.totalViolationCount),
      reportBlockedUntil: citizen.reportBlockedUntil
    }
  }

  const { pointsPerUnit, allowedVariancePercent, penaltyPercent, minKgRequired, maxKgRequired } = config

  // ════════════════════════════════════════════════════════════════════
  // STEP 0: Check cooldown (block)
  // ════════════════════════════════════════════════════════════════════
  if (citizen.reportBlockedUntil && currentTime < new Date(citizen.reportBlockedUntil)) {
    throw new ApiError(403, 'Bạn đang bị tạm khóa và không thể tạo báo cáo mới')
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 1: Validate minimum weight
  // ════════════════════════════════════════════════════════════════════
  if (collectorActualKg < Number(minKgRequired)) {
    await rewardRepository.insertPointTransaction(connection, {
      pointTransactionId: uuidv4(),
      citizenId,
      wasteReportId,
      pointsDelta: 0,
      transactionReason: 'Khối lượng rác không đạt mức tối thiểu',
      createdAt: currentTime
    })

    return {
      finalPoints: 0,
      variancePercent: 0,
      penaltyApplied: false,
      isFake: false,
      currentLevel: getViolationLevel(citizen.totalViolationCount),
      reportBlockedUntil: citizen.reportBlockedUntil
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 2: Validate maximum weight (anti-spam cap)
  // ════════════════════════════════════════════════════════════════════
  let actualKg = collectorActualKg
  if (maxKgRequired !== null && maxKgRequired !== undefined && actualKg > Number(maxKgRequired)) {
    actualKg = Number(maxKgRequired)
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 3: Calculate base points
  // ════════════════════════════════════════════════════════════════════
  const baseKgForPoints = Math.min(citizenReportKg, actualKg)
  const pointsRaw = baseKgForPoints * Number(pointsPerUnit)
  const points = Math.floor(pointsRaw)

  // ════════════════════════════════════════════════════════════════════
  // STEP 4: Calculate variance
  // ════════════════════════════════════════════════════════════════════
  let variancePercent = 0

  if (actualKg === 0) {
    variancePercent = 100
  } else if (actualKg < citizenReportKg) {
    // Only calculate variance if the collector recorded LESS weight than reported
    const difference = citizenReportKg - actualKg
    variancePercent = (difference / actualKg) * 100
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 5: Detect FAKE REPORT
  // ════════════════════════════════════════════════════════════════════
  let isFake = false
  if (actualKg === 0) {
    isFake = true
  } else if (variancePercent > Number(allowedVariancePercent)) {
    isFake = true
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 6: Reward & penalty calculation
  // ════════════════════════════════════════════════════════════════════
  let finalPoints
  let penaltyApplied = false

  if (!isFake) {
    // Valid report → full reward
    finalPoints = points

    await rewardRepository.insertPointTransaction(connection, {
      pointTransactionId: uuidv4(),
      citizenId,
      wasteReportId,
      pointsDelta: points,
      transactionReason: 'Thưởng điểm cho báo cáo rác hợp lệ',
      createdAt: currentTime
    })

    // Update citizen total points
    await rewardRepository.updateCitizenPoints(connection, citizenId, points)
  } else {
    // Fake report → reward then penalize
    penaltyApplied = true
    const penalty = Math.floor((points * Number(penaltyPercent)) / 100)
    finalPoints = points - penalty

    // Insert reward transaction
    await rewardRepository.insertPointTransaction(connection, {
      pointTransactionId: uuidv4(),
      citizenId,
      wasteReportId,
      pointsDelta: points,
      transactionReason: 'Thưởng điểm trước khi áp dụng phạt',
      createdAt: currentTime
    })

    // Insert penalty transaction
    await rewardRepository.insertPointTransaction(connection, {
      pointTransactionId: uuidv4(),
      citizenId,
      wasteReportId,
      pointsDelta: -penalty,
      transactionReason: 'Phạt do báo cáo không chính xác',
      createdAt: currentTime
    })

    // Update citizen total points (net = points - penalty)
    await rewardRepository.updateCitizenPoints(connection, citizenId, finalPoints)
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 7: Update violations (ONLY IF FAKE)
  // ════════════════════════════════════════════════════════════════════
  let fakeViolationCount = citizen.fakeViolationCount
  let totalViolationCount = citizen.totalViolationCount
  let lastViolationAt = citizen.lastViolationAt
  let lastPenaltyLevel = citizen.lastPenaltyLevel
  let reportBlockedUntil = citizen.reportBlockedUntil

  if (isFake) {
    fakeViolationCount += 1
    totalViolationCount += 1
    lastViolationAt = currentTime
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 8: Determine violation level
  // ════════════════════════════════════════════════════════════════════
  const currentLevel = getViolationLevel(totalViolationCount)

  // ════════════════════════════════════════════════════════════════════
  // STEP 9: Apply penalty IF level escalated
  // ════════════════════════════════════════════════════════════════════
  const penaltyResult = await applyPenaltyIfLevelEscalated(connection, {
    citizenId,
    userAccountId,
    wasteReportId,
    currentLevel,
    lastPenaltyLevel,
    currentTime,
    penaltyPercent: Number(penaltyPercent)
  })

  lastPenaltyLevel = penaltyResult.lastPenaltyLevel
  if (penaltyResult.reportBlockedUntil) {
    reportBlockedUntil = penaltyResult.reportBlockedUntil
  }

  // ── Persist violation updates ──────────────────────────────────────
  if (isFake) {
    await rewardRepository.updateCitizenViolation(connection, citizenId, {
      fakeViolationCount,
      totalViolationCount,
      lastViolationAt,
      lastPenaltyLevel,
      reportBlockedUntil
    })
  }

  // ── Return result ──────────────────────────────────────────────────
  return {
    finalPoints,
    variancePercent: Math.round(variancePercent * 100) / 100,
    penaltyApplied,
    isFake,
    currentLevel,
    reportBlockedUntil
  }
}

/**
 * Force mark a report as fake by collector decision.
 *
 * Business behavior:
 *   - Base points are always 0
 *   - Fake + total violation counters are incremented
 *   - Escalation penalties are applied exactly like create-report violations
 *
 * @param {object} connection - mysql2 connection (active transaction)
 * @param {object} params
 * @param {string} params.citizenId
 * @param {string} params.userAccountId
 * @param {string} params.wasteReportId
 * @param {Date} params.currentTime
 * @returns {object}
 */
async function processForcedFakeViolation(connection, { citizenId, userAccountId, wasteReportId, currentTime }) {
  const citizen = await rewardRepository.findCitizenForReward(connection, citizenId)
  if (!citizen) {
    throw new ApiError(404, 'Citizen not found')
  }

  const fakeViolationCount = (citizen.fakeViolationCount || 0) + 1
  const totalViolationCount = (citizen.totalViolationCount || 0) + 1
  const lastViolationAt = currentTime

  const currentLevel = getViolationLevel(totalViolationCount)
  const penaltyResult = await applyPenaltyIfLevelEscalated(connection, {
    citizenId,
    userAccountId,
    wasteReportId,
    currentLevel,
    lastPenaltyLevel: citizen.lastPenaltyLevel || 0,
    currentTime
  })

  await rewardRepository.insertPointTransaction(connection, {
    pointTransactionId: uuidv4(),
    citizenId,
    wasteReportId,
    pointsDelta: 0,
    transactionReason: 'Báo cáo bị đánh dấu giả - không cộng điểm',
    createdAt: currentTime
  })

  await rewardRepository.updateCitizenViolation(connection, citizenId, {
    fakeViolationCount,
    totalViolationCount,
    lastViolationAt,
    lastPenaltyLevel: penaltyResult.lastPenaltyLevel,
    reportBlockedUntil: penaltyResult.reportBlockedUntil || citizen.reportBlockedUntil
  })

  return {
    finalPoints: 0,
    variancePercent: 100,
    penaltyApplied: true,
    isFake: true,
    currentLevel,
    reportBlockedUntil: penaltyResult.reportBlockedUntil || citizen.reportBlockedUntil
  }
}

/**
 * Process reward for a multi-item completed waste report (Option B).
 * Calculates points per item. If an item has high variance, only that item is penalized.
 * The report is NOT marked as completely fake, and no violation level is escalated.
 *
 * @param {object} connection - mysql2 connection (active transaction)
 * @param {object} params
 * @param {string} params.citizenId
 * @param {string} params.userAccountId
 * @param {string} params.wasteReportId
 * @param {string} params.collectedRecordId
 * @param {Date}   params.currentTime
 * @returns {object} Final points and variance info
 */
async function processRewardMultiItems(
  connection,
  { citizenId, userAccountId, wasteReportId, collectedRecordId, currentTime }
) {
  // 1. Fetch citizen data (FOR UPDATE)
  const citizen = await rewardRepository.findCitizenForReward(connection, citizenId)
  if (!citizen) throw new ApiError(404, 'Citizen not found')

  if (citizen.reportBlockedUntil && currentTime < new Date(citizen.reportBlockedUntil)) {
    throw new ApiError(403, 'Bạn đang bị tạm khóa và không thể tạo báo cáo mới')
  }

  // 2. Fetch items
  const citizenItems = await rewardRepository.findReportItems(connection, wasteReportId)
  const collectorItems = await rewardRepository.findCollectedItems(connection, collectedRecordId)

  // Map collector items for easy lookup
  const collectorItemMap = new Map()
  for (const item of collectorItems) {
    collectorItemMap.set(item.waste_type_id, Number(item.actual_quantity))
  }

  let totalFinalPoints = 0
  let totalVarianceSum = 0
  let penaltyApplied = false

  // Fetch report code for transaction reasons
  const reportCode = await rewardRepository.findReportCodeById(connection, wasteReportId)

  // 3. Process each citizen item
  for (const citizenItem of citizenItems) {
    const wasteTypeId = citizenItem.waste_type_id
    const citizenKg = Number(citizenItem.quantity)
    const actualKg = collectorItemMap.get(wasteTypeId) || 0 // 0 if collector didn't collect this type

    // Fetch waste type name for better transaction reason
    const wasteTypeName = await rewardRepository.findWasteTypeName(connection, wasteTypeId)

    const config = await rewardRepository.findRewardConfigByWasteType(connection, wasteTypeId)
    if (!config) continue // Skip if no config

    const { pointsPerUnit, allowedVariancePercent, penaltyPercent, minKgRequired, maxKgRequired } = config

    // Check minimum config
    if (actualKg < Number(minKgRequired)) {
      continue // No points for this item
    }

    // Check maximum config
    let cappedActualKg = actualKg
    if (maxKgRequired !== null && maxKgRequired !== undefined && cappedActualKg > Number(maxKgRequired)) {
      cappedActualKg = Number(maxKgRequired)
    }

    // Base points for this item
    const baseKgForPoints = Math.min(citizenKg, cappedActualKg)
    const points = Math.floor(baseKgForPoints * Number(pointsPerUnit))

    // Variance for this item
    let itemVariancePercent = 0
    if (cappedActualKg === 0) {
      itemVariancePercent = 100
    } else if (cappedActualKg < citizenKg) {
      const difference = citizenKg - cappedActualKg
      itemVariancePercent = (difference / cappedActualKg) * 100
    }

    totalVarianceSum += itemVariancePercent

    const isItemFake = cappedActualKg === 0 || itemVariancePercent > Number(allowedVariancePercent)

    if (!isItemFake) {
      // Valid item
      totalFinalPoints += points
      if (points > 0) {
        await rewardRepository.insertPointTransaction(connection, {
          pointTransactionId: uuidv4(),
          citizenId,
          wasteReportId,
          pointsDelta: points,
          transactionReason: `[${reportCode}] Thưởng ${points} điểm - ${wasteTypeName}`,
          createdAt: currentTime
        })
      }
    } else {
      // Fake item → penalty for this item only
      penaltyApplied = true
      const penalty = Math.floor((points * Number(penaltyPercent)) / 100)
      const netPoints = points - penalty
      totalFinalPoints += netPoints

      if (points > 0) {
        await rewardRepository.insertPointTransaction(connection, {
          pointTransactionId: uuidv4(),
          citizenId,
          wasteReportId,
          pointsDelta: points,
          transactionReason: `[${reportCode}] Thưởng ${points} điểm - ${wasteTypeName} (dự kiến)`,
          createdAt: currentTime
        })
      }

      if (penalty > 0) {
        await rewardRepository.insertPointTransaction(connection, {
          pointTransactionId: uuidv4(),
          citizenId,
          wasteReportId,
          pointsDelta: -penalty,
          transactionReason: `[${reportCode}] Phạt ${penalty} điểm - ${wasteTypeName} sai ${itemVariancePercent.toFixed(1)}%`,
          createdAt: currentTime
        })
      }
    }
  }

  // Update total points ONCE
  if (totalFinalPoints !== 0) {
    await rewardRepository.updateCitizenPoints(connection, citizenId, totalFinalPoints)
  }

  // Option B: No overall fake marker, no violation escalation
  const avgVariance = citizenItems.length > 0 ? totalVarianceSum / citizenItems.length : 0

  return {
    finalPoints: totalFinalPoints,
    variancePercent: Math.round(avgVariance * 100) / 100,
    penaltyApplied,
    isFake: false, // Overall report is not entirely fake
    currentLevel: getViolationLevel(citizen.totalViolationCount),
    reportBlockedUntil: citizen.reportBlockedUntil
  }
}

module.exports = {
  processReward,
  processRewardMultiItems,
  processForcedFakeViolation,
  checkSpam,
  checkDuplicateAndHandleSpam,
  getViolationLevel
}
