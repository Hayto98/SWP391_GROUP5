const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: __dirname + '/.env' });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3309),
    user: process.env.DB_USER || 'haittse',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'haittse',
  });

  try {
    const statusesToAdd = ['PENDING', 'ACCEPTED', 'REJECTED'];

    for (const status of statusesToAdd) {
      const [existing] = await pool.query('SELECT report_status_type_id FROM ReportStatusType WHERE status_name = ?', [status]);
      if (existing.length === 0) {
        const id = uuidv4();
        await pool.query('INSERT INTO ReportStatusType (report_status_type_id, status_name) VALUES (?, ?)', [id, status]);
        console.log(`Successfully added status: ${status} with ID: ${id}`);
      } else {
        console.log(`Status already exists: ${status} (ID: ${existing[0].report_status_type_id})`);
      }
    }
  } catch (error) {
    console.error('Error inserting statuses:', error.message);
  } finally {
    await pool.end();
  }
}

run();
