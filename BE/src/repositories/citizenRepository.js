const db = require('../config/database')

async function findByUserAccountId(userAccountId) {
  const [rows] = await db.execute(
    `SELECT citizen_id AS citizenId,
            user_account_id AS userAccountId,
            total_points AS totalPoints
       FROM citizen
      WHERE user_account_id = ?
      LIMIT 1`,
    [userAccountId]
  )

  return rows[0] || null
}

async function findByUserAccountIdForUpdate(connection, userAccountId) {
  const [rows] = await connection.execute(
    `SELECT citizen_id AS citizenId,
            user_account_id AS userAccountId,
            total_points AS totalPoints
       FROM citizen
      WHERE user_account_id = ?
      LIMIT 1 FOR UPDATE`,
    [userAccountId]
  )

  return rows[0] || null
}


/**
 * Fetch point transactions for a citizen with optional filters and pagination.
 * @param {string} citizenId
 * @param {object} opts
 * @param {string} [opts.fromDate] ISO date
 * @param {string} [opts.toDate] ISO date
 * @param {string} [opts.type] 'EARN'|'REDEEM'
 * @param {number} [opts.page]
 * @param {number} [opts.limit]
 */
async function findPointTransactions(citizenId, { fromDate, toDate, type, page = 1, limit = 20 } = {}) {
  const where = ['pt.citizen_id = ?']
  const params = [citizenId]

  if (fromDate) {
    where.push('pt.created_at >= ?')
    params.push(fromDate)
  }

  if (toDate) {
    where.push('pt.created_at <= ?')
    params.push(toDate)
  }

  if (type === 'EARN') {
    where.push('pt.points_delta > 0')
  } else if (type === 'REDEEM') {
    where.push('pt.points_delta < 0')
  }

  const safePage = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20))
  const offset = (safePage - 1) * safeLimit

  const sql = `SELECT
      pt.point_transaction_id AS transactionId,
      CASE WHEN pt.points_delta > 0 THEN 'EARN' ELSE 'REDEEM' END AS type,
      pt.points_delta AS points,
      CASE
        WHEN pt.points_delta < 0 AND v.voucher_code IS NOT NULL THEN CONCAT('Redeem voucher ', v.voucher_code)
        ELSE pt.transaction_reason
      END AS reason,
      pt.created_at AS createdAt
    FROM pointtransaction pt
    LEFT JOIN wastereport wr ON pt.waste_report_id = wr.waste_report_id
    LEFT JOIN voucherredemption vr
      ON pt.points_delta < 0
     AND vr.citizen_id = pt.citizen_id
     AND vr.points_used = ABS(pt.points_delta)
     AND vr.redeemed_at = pt.created_at
    LEFT JOIN voucher v ON vr.voucher_id = v.voucher_id
    WHERE ${where.join(' AND ')}
    ORDER BY pt.created_at DESC
    LIMIT ? OFFSET ?`

  params.push(safeLimit, offset)
  const [rows] = await db.query(sql, params)
  return rows
}

module.exports = { findByUserAccountId, findByUserAccountIdForUpdate, findPointTransactions }
