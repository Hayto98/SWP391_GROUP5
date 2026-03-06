const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Lấy ID của một loại trạng thái dựa trên tên (status_name)
 */
async function findStatusTypeIdByName(statusName) {
  const [rows] = await db.execute('SELECT report_status_type_id FROM REPORTSTATUSTYPE WHERE status_name = ?', [statusName]);
  return rows[0]?.report_status_type_id || null;
}

/**
 * Thêm một bản ghi vào ReportStatusHistory
 */
async function addReportStatusHistory(wasteReportId, reportStatusTypeId, changedByUserAccountId = null) {
  // ... existing code
  const historyId = uuidv4();
  const changedAt = new Date();
  await db.execute(
    `INSERT INTO REPORTSTATUSHISTORY (report_status_history_id, waste_report_id, report_status_type_id, changed_by_user_account_id, changed_at)
     VALUES (?, ?, ?, ?, ?)`,
    [historyId, wasteReportId, reportStatusTypeId, changedByUserAccountId, changedAt]
  );
  
  // Cập nhật luôn trạng thái hiện tại ở bản ghi gốc WasteReport
  await db.execute(
    `UPDATE WASTEREPORT SET report_status_type_id = ? WHERE waste_report_id = ?`,
    [reportStatusTypeId, wasteReportId]
  );
  return { historyId, changedAt };
}

/**
 * Lấy số lượng assign của một Collector
 */
async function getCollectorAssignmentCount(collectorId) {
  const [rows] = await db.execute(`
    SELECT COUNT(*) AS count
    FROM WASTEREPORT
    WHERE assigned_collector_id = ?
      AND report_status_type_id IN (
        SELECT report_status_type_id 
        FROM REPORTSTATUSTYPE 
        WHERE status_name IN ('ASSIGNED', 'IN_PROGRESS')
      )
  `, [collectorId]);
  return rows[0]?.count || 0;
}

/**
 * Kiểm tra xem báo cáo rác thải đã được assign chưa (1 report = 1 collector)
 */
async function isReportAlreadyAssigned(reportId) {
  const [rows] = await db.execute('SELECT assigned_collector_id FROM WASTEREPORT WHERE waste_report_id = ? AND assigned_collector_id IS NOT NULL', [reportId]);
  return rows.length > 0;
}

/**
 * Bind Collector vào Report
 */
async function assignCollectorToReport(reportId, collectorId) {
  const statusTypeId = await findStatusTypeIdByName('ASSIGNED');
  await db.execute(
    `UPDATE WASTEREPORT 
     SET assigned_collector_id = ?, report_status_type_id = ?
     WHERE waste_report_id = ?`,
    [collectorId, statusTypeId, reportId]
  );
}

/**
 * Thêm Feedback (Lý do từ chối)
 */
async function addFeedback(wasteReportId, citizenId, feedbackText) {
  const feedbackId = uuidv4();
  const createdAt = new Date();
  await db.execute(
    `INSERT INTO FEEDBACK (feedback_id, waste_report_id, citizen_id, feedback_text, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [feedbackId, wasteReportId, citizenId, feedbackText, createdAt]
  );
  return { feedbackId, createdAt };
}

module.exports = {
  findStatusTypeIdByName,
  addReportStatusHistory,
  getCollectorAssignmentCount,
  isReportAlreadyAssigned,
  assignCollectorToReport,
  addFeedback
};
