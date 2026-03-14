const db = require('../config/database')

// ==================== VOUCHER SEQUENCE ====================

/**
 * Atomically fetch and increment the next voucher sequence number for a given year.
 *
 * Uses INSERT ... ON DUPLICATE KEY UPDATE with LAST_INSERT_ID() to guarantee
 * a unique, monotonically-increasing value even under concurrent requests.
 *
 * The VoucherSequence table must exist:
 *   CREATE TABLE VoucherSequence (
 *     year INT PRIMARY KEY,
 *     next_val INT NOT NULL DEFAULT 1
 *   );
 *
 * @param {number} year - The year to generate the sequence for
 * @returns {Promise<number>} The next sequence number (already consumed)
 */
async function getNextSequence(year) {
  const connection = await db.getConnection()
  try {
    // Atomic upsert: inserts year with 1 if new, or increments existing next_val
    const incrementQuery = `
      INSERT INTO VoucherSequence (year, next_val)
      VALUES (?, LAST_INSERT_ID(1))
      ON DUPLICATE KEY UPDATE
          next_val = LAST_INSERT_ID(next_val + 1)
    `
    await connection.execute(incrementQuery, [year])

    // LAST_INSERT_ID() is session-scoped — safe for concurrent connections
    const [rows] = await connection.execute('SELECT LAST_INSERT_ID() AS sequence_number')
    return rows[0].sequence_number
  } finally {
    connection.release()
  }
}

module.exports = {
  getNextSequence
}
