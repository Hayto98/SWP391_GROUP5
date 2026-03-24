const db = require('../config/database')

class EnterpriseRepository {
  /**
   * Fetch all essential dashboard stats using a massive single highly optimized query.
   * JSON_OBJECT and JSON_ARRAYAGG prevent N+1 queries.
   */
  async getDashboardStatistics(startDate, endDate, timeFormat, startOfCurrentMonth, startOfNextMonth) {
    const query = `
      SELECT 
        (
          SELECT JSON_OBJECT(
            'totalReports', COUNT(waste_report_id),
            'pendingReports', SUM(CASE WHEN report_status_type_id = 1 THEN 1 ELSE 0 END),
            'inProgressReports', SUM(CASE WHEN report_status_type_id = 6 THEN 1 ELSE 0 END)
          )
          FROM wastereport 
          WHERE created_at >= ? AND created_at < ?
        ) AS statusStats,
        
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('wasteType', wasteType, 'quantity', quantity)
          )
          FROM (
            SELECT 
              wt.waste_type_name AS wasteType,
              COALESCE(SUM(cr.actual_quantity_value), 0) AS quantity
            FROM wastereport wr
            LEFT JOIN (SELECT waste_report_id, MIN(waste_type_id) as waste_type_id FROM waste_report_item GROUP BY waste_report_id) first_item ON wr.waste_report_id = first_item.waste_report_id
            JOIN wastetype wt ON first_item.waste_type_id = wt.waste_type_id
            JOIN collectedrecord cr ON wr.waste_report_id = cr.waste_report_id
            WHERE wr.created_at >= ? AND wr.created_at < ?
            GROUP BY wt.waste_type_name
          ) subWaste
        ) AS wasteByType,

        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('time', timeStr, 'reports', reports)
          )
          FROM (
            SELECT 
              DATE_FORMAT(created_at, ?) AS timeStr,
              COUNT(waste_report_id) AS reports
            FROM wastereport
            WHERE created_at >= ? AND created_at < ?
            GROUP BY timeStr
            ORDER BY timeStr ASC
          ) subTime
        ) AS reportsByTime,

        (
          SELECT JSON_OBJECT(
            'weeklyTasks', SUM(CASE WHEN YEARWEEK(assignedAt, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END),
            'monthlyTasks', SUM(CASE WHEN assignedAt >= ? AND assignedAt < ? THEN 1 ELSE 0 END)
          )
          FROM wastereport 
          WHERE assigned_collector_id IS NOT NULL
        ) AS collectorStats,

        (
          SELECT JSON_OBJECT(
            'totalCollectors', COUNT(user_account_id),
            'activeCollectors', SUM(CASE WHEN is_working = 1 THEN 1 ELSE 0 END),
            'idleCollectors', SUM(CASE WHEN is_working = 0 THEN 1 ELSE 0 END)
          )
          FROM useraccount
          WHERE role_id = 2 AND is_locked = 0
        ) AS staffStats
    `

    const [rows] = await db.query(query, [
      startDate, endDate,
      startDate, endDate,
      timeFormat, startDate, endDate,
      startOfCurrentMonth, startOfNextMonth
    ])

    return rows[0] || {}
  }

  /**
   * Fetch employee statistics with pagination:
   * Total assigned, completed, and rejected reports for each collector.
   * Can be filtered by a specific month or week if needed, though default is all-time or configurable via query timeframe.
   */
  async getEmployeeStatistics({ limit, offset, month, year }) {
    let dateFilter = ''
    const params = []

    if (month && year) {
      dateFilter = 'AND MONTH(wr.assigned_at) = ? AND YEAR(wr.assigned_at) = ?'
      params.push(Number(month), Number(year))
    } else if (year) {
      dateFilter = 'AND YEAR(wr.assigned_at) = ?'
      params.push(Number(year))
    }

    // Main query
    const query = `
      SELECT 
        ua.user_account_id AS employeeId,
        ua.fullname AS employeeName,
        ua.email AS employeeEmail,
        COUNT(wr.waste_report_id) AS totalAssigned,
        SUM(CASE WHEN rst.status_name = 'COMPLETED' THEN 1 ELSE 0 END) AS totalCompleted,
        SUM(CASE WHEN rst.status_name = 'REJECTED' THEN 1 ELSE 0 END) AS totalRejected
      FROM useraccount ua
      LEFT JOIN wastereport wr ON ua.user_account_id = wr.assigned_collector_id ${dateFilter}
      LEFT JOIN reportstatustype rst ON wr.report_status_type_id = rst.report_status_type_id
      WHERE ua.role_id = 3 AND ua.is_locked = 0
      GROUP BY ua.user_account_id
      ORDER BY totalCompleted DESC, totalAssigned DESC
      LIMIT ? OFFSET ?
    `
    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM useraccount
      WHERE role_id = 3 AND is_locked = 0
    `

    params.push(Number(limit), Number(offset))
    
    const [rows] = await db.query(query, params)
    const [countRows] = await db.query(countQuery)

    return {
      data: rows,
      total: countRows[0].total
    }
  }
}

module.exports = new EnterpriseRepository()
