const db = require('../config/database')

/**
 * Repository: Reward
 *
 * Handles reward-specific DB operations for the 10-step reward calculation.
 * All functions that accept a `connection` parameter are designed for use
 * inside a transaction.
 */

// ==================== READ ====================

/**
 * Fetch citizen data needed for reward processing (with violation fields).
 * Uses FOR UPDATE to lock the row during transaction.
 *
 * @param {object} connection - mysql2 connection (transaction)
 * @param {string} citizenId
 * @returns {object|null}
 */
async function findCitizenForReward(connection, citizenId) {
  const [rows] = await connection.execute(
    `SELECT
       c.citizen_id             AS citizenId,
       c.user_account_id        AS userAccountId,
       c.total_points           AS totalPoints,
       c.spam_violation_count   AS spamViolationCount,
       c.fake_violation_count   AS fakeViolationCount,
       c.total_violation_count  AS totalViolationCount,
       c.last_violation_at      AS lastViolationAt,
       c.report_blocked_until   AS reportBlockedUntil,
       c.last_penalty_level     AS lastPenaltyLevel,
       ua.is_locked             AS isLocked
     FROM citizen c
     JOIN useraccount ua ON c.user_account_id = ua.user_account_id
     WHERE c.citizen_id = ?
     LIMIT 1 FOR UPDATE`,
    [citizenId]
  )
  return rows[0] || null
}

/**
 * Fetch active reward config for a waste type (with penalty and weight fields).
 *
 * @param {object} connection - mysql2 connection
 * @param {string|number} wasteTypeId
 * @returns {object|null}
 */
async function findRewardConfigByWasteType(connection, wasteTypeId) {
  const [rows] = await connection.execute(
    `SELECT
       reward_config_id          AS rewardConfigId,
       waste_type_id             AS wasteTypeId,
       points_per_unit           AS pointsPerUnit,
       allowed_variance_percent  AS allowedVariancePercent,
       penalty_percent           AS penaltyPercent,
       min_kg_required           AS minKgRequired,
       max_kg_required           AS maxKgRequired
     FROM rewardconfig
     WHERE waste_type_id = ?
       AND is_active = 1
     LIMIT 1`,
    [wasteTypeId]
  )
  return rows[0] || null
}

/**
 * Fetch all items reported by citizen for a report (inside transaction).
 *
 * @param {object} connection
 * @param {string} wasteReportId
 * @returns {Array}
 */
async function findReportItems(connection, wasteReportId) {
  const [rows] = await connection.execute(
    `SELECT waste_type_id, quantity
     FROM waste_report_item
     WHERE waste_report_id = ?`,
    [wasteReportId]
  )
  return rows
}

/**
 * Fetch all actual items recorded by collector for a collected record (inside transaction).
 *
 * @param {object} connection
 * @param {string} collectedRecordId
 * @returns {Array}
 */
async function findCollectedItems(connection, collectedRecordId) {
  const [rows] = await connection.execute(
    `SELECT waste_type_id, actual_quantity
     FROM collected_item
     WHERE collected_record_id = ?`,
    [collectedRecordId]
  )
  return rows
}

// ==================== WRITE ====================

/**
 * Insert a PointTransaction record.
 *
 * @param {object} connection
 * @param {object} data
 */
async function insertPointTransaction(connection, { pointTransactionId, citizenId, wasteReportId, pointsDelta, transactionReason, createdAt }) {
  await connection.execute(
    `INSERT INTO pointtransaction
       (point_transaction_id, citizen_id, waste_report_id,
        points_delta, transaction_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [pointTransactionId, citizenId, wasteReportId, pointsDelta, transactionReason, createdAt]
  )
}

/**
 * Atomically add pointsDelta to citizen.total_points.
 *
 * @param {object} connection
 * @param {string} citizenId
 * @param {number} pointsDelta
 */
async function updateCitizenPoints(connection, citizenId, pointsDelta) {
  await connection.execute(
    `UPDATE citizen
     SET total_points = total_points + ?
     WHERE citizen_id = ?`,
    [pointsDelta, citizenId]
  )
}

/**
 * Update citizen violation fields.
 *
 * @param {object} connection
 * @param {string} citizenId
 * @param {object} data
 */
async function updateCitizenViolation(connection, citizenId, {
  fakeViolationCount,
  totalViolationCount,
  lastViolationAt,
  lastPenaltyLevel,
  reportBlockedUntil
}) {
  await connection.execute(
    `UPDATE citizen
     SET fake_violation_count  = ?,
         total_violation_count = ?,
         last_violation_at     = ?,
         last_penalty_level    = ?,
         report_blocked_until  = ?
     WHERE citizen_id = ?`,
    [
      fakeViolationCount,
      totalViolationCount,
      lastViolationAt,
      lastPenaltyLevel,
      reportBlockedUntil ?? null,
      citizenId
    ]
  )
}

/**
 * Lock a user account (is_locked = 1).
 *
 * @param {object} connection
 * @param {string} userAccountId
 */
async function lockUserAccount(connection, userAccountId) {
  await connection.execute(
    `UPDATE useraccount SET is_locked = 1 WHERE user_account_id = ?`,
    [userAccountId]
  )
}

// ==================== SPAM DETECTION ====================

/**
 * Get the most recent report creation time for a citizen.
 *
 * @param {object} connection
 * @param {string} citizenId
 * @returns {Date|null}
 */
async function findLastReportTime(connection, citizenId) {
  const [rows] = await connection.execute(
    `SELECT MAX(wr.created_at) AS lastReportTime
     FROM wastereport wr
     WHERE wr.citizen_id = ?`,
    [citizenId]
  )
  return rows[0]?.lastReportTime || null
}

/**
 * Count how many reports a citizen created today (same calendar date).
 *
 * @param {object} connection
 * @param {string} citizenId
 * @param {Date} currentTime
 * @returns {number}
 */
async function countReportsToday(connection, citizenId, currentTime) {
  const dateStr = currentTime.toISOString().slice(0, 10) // YYYY-MM-DD
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS cnt
     FROM wastereport wr
     WHERE wr.citizen_id = ?
       AND DATE(wr.created_at) = ?`,
    [citizenId, dateStr]
  )
  return Number(rows[0].cnt)
}

/**
 * Update citizen spam violation fields.
 *
 * @param {object} connection
 * @param {string} citizenId
 * @param {object} data
 */
async function updateCitizenSpamViolation(connection, citizenId, {
  spamViolationCount,
  totalViolationCount,
  lastViolationAt
}) {
  await connection.execute(
    `UPDATE citizen
     SET spam_violation_count  = ?,
         total_violation_count = ?,
         last_violation_at     = ?
     WHERE citizen_id = ?`,
    [spamViolationCount, totalViolationCount, lastViolationAt, citizenId]
  )
}

module.exports = {
  findCitizenForReward,
  findRewardConfigByWasteType,
  findReportItems,
  findCollectedItems,
  insertPointTransaction,
  updateCitizenPoints,
  updateCitizenViolation,
  lockUserAccount,
  findLastReportTime,
  countReportsToday,
  updateCitizenSpamViolation
}
