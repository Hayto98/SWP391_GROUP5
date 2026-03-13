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

  // const offset = (Math.max(1, Number(page)) - 1) * Number(limit)
  const safePage = Number(page) > 0 ? Number(page) : 1
const safeLimit = Number(limit) > 0 ? Number(limit) : 20

const offset = (safePage - 1) * safeLimit
  const sql = `SELECT
      pt.point_transaction_id AS transactionId,
      CASE WHEN pt.points_delta > 0 THEN 'EARN' ELSE 'REDEEM' END AS type,
      pt.points_delta AS points,
      pt.transaction_reason AS reason,
      pt.created_at AS createdAt
    FROM pointtransaction pt
    LEFT JOIN wastereport wr ON pt.waste_report_id = wr.waste_report_id
    WHERE ${where.join(' AND ')}
    ORDER BY pt.created_at DESC
    LIMIT ? OFFSET ?`

  // params.push(Number(limit), offset)
  params.push(safeLimit, offset)
  try {
    const [rows] = await db.execute(sql, params)
    return rows
  } catch (err) {
    console.error('findPointTransactions SQL error', { sql, params, err: err && err.message })
    throw err
  }
}

module.exports = { findByUserAccountId, findPointTransactions }
