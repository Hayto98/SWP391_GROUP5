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
            LEFT JOIN (
              SELECT waste_report_id, waste_type_id
              FROM waste_report_item wri1
              WHERE created_at = (
                SELECT MIN(created_at) FROM waste_report_item wri2 WHERE wri1.waste_report_id = wri2.waste_report_id
              )
              LIMIT 1
            ) first_item ON wr.waste_report_id = first_item.waste_report_id
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
}

module.exports = new EnterpriseRepository()
