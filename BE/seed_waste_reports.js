const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3309),
    user: process.env.DB_USER || 'haittse',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'haittse',
  });

  try {
    const userEmail = 'tthanhhai@example.com';
    const [users] = await pool.query('SELECT user_account_id FROM useraccount WHERE email = ?', [userEmail]);
    if (users.length === 0) {
      console.log('User not found. Please register an account with email:', userEmail);
      return;
    }
    const userAccountId = users[0].user_account_id;

    // 1. Create Citizen record for this user if not exists
    let citizenId;
    const [citizens] = await pool.query('SELECT citizen_id FROM citizen WHERE user_account_id = ?', [userAccountId]);
    if (citizens.length === 0) {
      citizenId = uuidv4();
      await pool.query('INSERT INTO citizen (citizen_id, user_account_id, total_points, created_at) VALUES (?, ?, 0, NOW())', [citizenId, userAccountId]);
      console.log('Created Citizen record.');
    } else {
      citizenId = citizens[0].citizen_id;
    }

    // 2. Insert dummy WasteTypes
    const wasteTypeId = uuidv4();
    await pool.query('INSERT INTO wastetype (waste_type_id, waste_type_name, unit_type, is_active) VALUES (?, "Nhua", "KG", 1) ON DUPLICATE KEY UPDATE waste_type_name="Nhua"', [wasteTypeId]);
    console.log('Inserted WasteType.');

    // 3. Insert ReportStatusType
    const statusTypeId = uuidv4();
    await pool.query('INSERT INTO reportstatustype (report_status_type_id, status_name) VALUES (?, "ASSIGNED") ON DUPLICATE KEY UPDATE status_name="ASSIGNED"', [statusTypeId]);
    
    // Insert OPEN type as well
    const openStatusId = uuidv4();
    await pool.query('INSERT INTO reportstatustype (report_status_type_id, status_name) VALUES (?, "OPEN") ON DUPLICATE KEY UPDATE status_name="OPEN"', [openStatusId]);

    // 4. Create a fake Collector UserAccount
    let collectorAccountId;
    const [existingCollectors] = await pool.query('SELECT user_account_id FROM useraccount WHERE email = ?', ['collector@example.com']);
    
    if (existingCollectors.length > 0) {
       collectorAccountId = existingCollectors[0].user_account_id;
    } else {
       collectorAccountId = uuidv4();
       await pool.query(`
         INSERT INTO useraccount 
         (user_account_id, fullname, email, phone, password_hash, role_id, created_at) 
         VALUES (?, 'Tran Van Collector', 'collector@example.com', '0912345678', 'dummyhash', 4, NOW())
       `, [collectorAccountId]);
    }

    // 5. Create WasteReport
    const wasteReportId = uuidv4();
    await pool.query(`
      INSERT INTO wastereport 
      (waste_report_id, citizen_id, waste_type_id, is_duplicate, gps_lat, gps_lng, description, created_at)
      VALUES (?, ?, ?, 0, 10.123, 106.123, 'Bao cao rac thai nhua o nga tu', NOW())
    `, [wasteReportId, citizenId, wasteTypeId]);
    console.log('Inserted WasteReport.');

    // 6. Add attachments
    const attachmentId = uuidv4();
    await pool.query(`
      INSERT INTO reportattachment (report_attachment_id, waste_report_id, file_uri, uploaded_at)
      VALUES (?, ?, 'https://example.com/image.jpg', NOW())
    `, [attachmentId, wasteReportId]);

    // 7. Add Status History (First OPEN, then ASSIGNED)
    const historyId1 = uuidv4();
    const historyId2 = uuidv4();
    await pool.query('INSERT INTO reportstatushistory (report_status_history_id, waste_report_id, report_status_type_id, changed_at) VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL 1 HOUR))', [historyId1, wasteReportId, openStatusId]);
    await pool.query('INSERT INTO reportstatushistory (report_status_history_id, waste_report_id, report_status_type_id, changed_at) VALUES (?, ?, ?, NOW())', [historyId2, wasteReportId, statusTypeId]);

    // 8. Assign Collector to the record
    const collectedRecordId = uuidv4();
    await pool.query(`
      INSERT INTO collectedrecord (collected_record_id, waste_report_id, collector_user_account_id, actual_quantity_value, quantity_unit, recorded_at)
      VALUES (?, ?, ?, 5.0, 'KG', NOW())
    `, [collectedRecordId, wasteReportId, collectorAccountId]);

    console.log('Seed data inserted successfully!');
    
  } catch (error) {
    console.error('Error inserting seed data:', error);
  } finally {
    await pool.end();
  }
}

run();
