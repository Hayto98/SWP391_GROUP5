const db = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');
const enterpriseReportService = require('./src/services/enterpriseReportService');
const { ROLES } = require('./src/utils/constants');

async function runTest() {
  let collectorId, reportId, enterpriseId, citizenId;
  let statusAssignedId, statusAcceptedId;
  
  try {
    console.log("Starting DB Setup...");
    collectorId = uuidv4();
    enterpriseId = uuidv4();
    reportId = uuidv4();
    
    // 1. Create Enterprise User
    await db.execute(
      `INSERT INTO UserAccount (user_account_id, fullname, email, phone, password_hash, role_id)
       VALUES (?, 'Test Enterprise', 'ent_test@test.com', '0000000001', 'hash', ?)`,
      [enterpriseId, ROLES.ENTERPRISE]
    );

    // 2. Create Collector User
    await db.execute(
      `INSERT INTO UserAccount (user_account_id, fullname, email, phone, password_hash, role_id)
       VALUES (?, 'Test Collector', 'col_test@test.com', '0000000002', 'hash', ?)`,
      [collectorId, ROLES.COLLECTOR]
    );

    // 3. Find an existing citizen user to link the report to
    const [citizenRes] = await db.execute('SELECT citizen_id FROM Citizen LIMIT 1');
    citizenId = citizenRes.length > 0 ? citizenRes[0].citizen_id : null;
    
    if (!citizenId) throw new Error("Need at least 1 citizen to create report in this test DB.");

    const [wtRes] = await db.execute('SELECT waste_type_id FROM WasteType LIMIT 1');
    const wasteTypeId = wtRes[0].waste_type_id;

    // 4. Create the Waste Report
    await db.execute(
      `INSERT INTO WasteReport (waste_report_id, citizen_id, waste_type_id, gps_lat, gps_lng, description, created_at, is_duplicate)
       VALUES (?, ?, ?, 0.0, 0.0, 'Test Description', ?, 0)`,
      [reportId, citizenId, wasteTypeId, new Date()]
    );

    // 5. Set it to ACCEPTED via ReportStatusHistory
    const [accRes] = await db.execute('SELECT report_status_type_id FROM ReportStatusType WHERE status_name = "ACCEPTED"');
    statusAcceptedId = accRes[0].report_status_type_id;
    
    const [assRes] = await db.execute('SELECT report_status_type_id FROM ReportStatusType WHERE status_name = "ASSIGNED"');
    statusAssignedId = assRes[0].report_status_type_id;

    await db.execute(
      `INSERT INTO ReportStatusHistory (report_status_history_id, waste_report_id, report_status_type_id, changed_by_user_account_id, changed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), reportId, statusAcceptedId, enterpriseId, new Date()]
    );

    console.log("DB Setup Complete. Running assignReport...");
    const result = await enterpriseReportService.assignReport(reportId, collectorId, enterpriseId);
    console.log("assignReport Result:", JSON.stringify(result, null, 2));

    console.log("Running validations...");
    // Validate that CollectedRecord is created
    const [records] = await db.execute('SELECT * FROM CollectedRecord WHERE waste_report_id = ?', [reportId]);
    if (records.length === 1 && records[0].collector_user_account_id === collectorId) {
       console.log("SUCCESS: CollectedRecord validated.");
    } else {
       console.error("FAIL: CollectedRecord not correct.");
    }

    // Validate that ReportStatusHistory has ASSIGNED
    const [history] = await db.execute('SELECT * FROM ReportStatusHistory WHERE waste_report_id = ? ORDER BY changed_at DESC LIMIT 1', [reportId]);
    if (history.length > 0 && history[0].report_status_type_id === statusAssignedId) {
       console.log("SUCCESS: ReportStatusHistory validated.");
    } else {
       console.error("FAIL: ReportStatusHistory not correct.");
    }

  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    // Cleanup
    console.log("Cleaning up DB...");
    if (reportId) {
      await db.execute('DELETE FROM CollectedRecord WHERE waste_report_id = ?', [reportId]);
      await db.execute('DELETE FROM ReportStatusHistory WHERE waste_report_id = ?', [reportId]);
      await db.execute('DELETE FROM WasteReport WHERE waste_report_id = ?', [reportId]);
    }
    if (collectorId) await db.execute('DELETE FROM UserAccount WHERE user_account_id = ?', [collectorId]);
    if (enterpriseId) await db.execute('DELETE FROM UserAccount WHERE user_account_id = ?', [enterpriseId]);
    process.exit(0);
  }
}

runTest();
