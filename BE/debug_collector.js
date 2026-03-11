require('dotenv').config()
const mysql = require('mysql2/promise')

async function debug() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3309),
        user: process.env.DB_USER || 'haittse',
        password: process.env.DB_PASSWORD || '123456',
        database: process.env.DB_NAME || 'haittse'
    })

    try {
        console.log('=== 1. COLLECTOR users ===')
        const [collectors] = await pool.query(
            `SELECT user_account_id, fullname, email, role_id, is_locked 
             FROM useraccount WHERE role_id IN (3, 4)`
        )
        console.table(collectors)

        console.log('\n=== 2. Reports with ASSIGNED status ===')
        const [assigned] = await pool.query(`
            SELECT rsh.waste_report_id, rst.status_name, rsh.changed_at
            FROM reportstatushistory rsh
            JOIN reportstatustype rst ON rsh.report_status_type_id = rst.report_status_type_id
            WHERE rst.status_name = 'ASSIGNED'
        `)
        console.table(assigned)

        console.log('\n=== 3. CollectedRecord entries ===')
        const [records] = await pool.query(
            `SELECT waste_report_id, collector_user_account_id FROM collectedrecord`
        )
        console.table(records)

        console.log('\n=== 4. Full match (ASSIGNED + collector) ===')
        const [fullMatch] = await pool.query(`
            SELECT 
                wr.waste_report_id,
                cr.collector_user_account_id,
                (
                    SELECT rst.status_name
                    FROM reportstatushistory rsh
                    JOIN reportstatustype rst ON rsh.report_status_type_id = rst.report_status_type_id
                    WHERE rsh.waste_report_id = wr.waste_report_id
                    ORDER BY rsh.changed_at DESC
                    LIMIT 1
                ) AS current_status
            FROM wastereport wr
            LEFT JOIN collectedrecord cr ON wr.waste_report_id = cr.waste_report_id
            HAVING current_status = 'ASSIGNED'
        `)
        console.table(fullMatch)

    } catch (err) {
        console.error('Error:', err.message)
    } finally {
        await pool.end()
    }
}

debug()
