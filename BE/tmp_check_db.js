const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:/code/Project_SWP/BE/.env' });

async function checkQuery() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3309),
    user: process.env.DB_USER || 'haittse',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'haittse',
  });

  try {
    const roleId = 4; // Collector
    const [rows] = await pool.query(`
      SELECT
        ua.user_account_id AS userAccountId,
        ua.fullname,
        ua.phone,
        (
          SELECT COUNT(*)
          FROM collectedrecord cr
          JOIN wastereport wr ON cr.waste_report_id = wr.waste_report_id
          WHERE cr.collector_user_account_id = ua.user_account_id
            AND (
              SELECT rst.status_name
              FROM reportstatushistory rsh
              JOIN reportstatustype rst ON rsh.report_status_type_id = rst.report_status_type_id
              WHERE rsh.waste_report_id = wr.waste_report_id
              ORDER BY rsh.changed_at DESC
              LIMIT 1
            ) = 'ASSIGNED'
        ) AS currentAssignedCount
      FROM useraccount ua
      WHERE ua.role_id = ? AND ua.is_locked = 0
      HAVING currentAssignedCount < 10
      ORDER BY currentAssignedCount ASC
    `, [roleId]);
    console.log("Query Results:");
    console.table(rows);
  } catch (error) {
    console.error('Query Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkQuery();
