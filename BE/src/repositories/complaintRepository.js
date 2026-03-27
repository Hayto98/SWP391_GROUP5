const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')

async function createComplaint({ wasteReportId, citizenId, complaintReason, attachments }) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    const reportComplaintId = uuidv4()
    
    // 1. Insert into reportcomplaint
    await connection.execute(
      `INSERT INTO reportcomplaint 
        (report_complaint_id, waste_report_id, citizen_id, complaint_reason, complaint_status, refund_points, is_deleted, created_at)
       VALUES (?, ?, ?, ?, 'OPEN', 0, 0, NOW())`,
      [reportComplaintId, wasteReportId, citizenId, complaintReason || null]
    )

    // 2. Insert into reportcomplaintattachment if there are attachments
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.fileUri) {
          const complaintAttachmentId = uuidv4()
          await connection.execute(
            `INSERT INTO reportcomplaintattachment 
              (complaint_attachment_id, report_complaint_id, file_uri, uploaded_at)
             VALUES (?, ?, ?, NOW())`,
            [complaintAttachmentId, reportComplaintId, attachment.fileUri]
          )
        }
      }
    }

    await connection.commit()
    return reportComplaintId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function findComplaintByCitizenAndReport(citizenId, wasteReportId) {
  const [rows] = await db.execute(
    `SELECT report_complaint_id FROM reportcomplaint 
     WHERE citizen_id = ? AND waste_report_id = ? AND is_deleted = 0 LIMIT 1`,
    [citizenId, wasteReportId]
  )
  return rows[0] || null
}

async function findMyComplaints(citizenId, { status, limit, offset }) {
  const parsedLimit = Number(limit)
  const parsedOffset = Number(offset)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.max(1, Math.trunc(parsedLimit)) : 10
  const safeOffset = Number.isFinite(parsedOffset) ? Math.max(0, Math.trunc(parsedOffset)) : 0

  let query = `
    SELECT SQL_CALC_FOUND_ROWS
      rc.report_complaint_id,
      rc.waste_report_id,
      rc.complaint_reason,
      rc.complaint_status,
      rc.refund_points,
      rc.admin_response,
      rc.created_at,
      GROUP_CONCAT(rca.file_uri SEPARATOR '|||') AS attachment_uris
    FROM reportcomplaint rc
    LEFT JOIN reportcomplaintattachment rca ON rc.report_complaint_id = rca.report_complaint_id
    WHERE rc.citizen_id = ? AND rc.is_deleted = 0
  `
  const queryParams = [citizenId]

  if (status && String(status).trim() !== '') {
    query += ` AND rc.complaint_status = ?`
    queryParams.push(String(status).trim().toUpperCase())
  }

  query += ` GROUP BY rc.report_complaint_id ORDER BY rc.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`

  const [rows] = await db.execute(query, queryParams)
  
  const [countRows] = await db.execute('SELECT FOUND_ROWS() as totalCount')
  const total = countRows[0].totalCount

  const data = rows.map(row => {
    const attachments = row.attachment_uris 
      ? row.attachment_uris.split('|||').filter(Boolean).map(uri => ({ fileUri: uri }))
      : []

    return {
      reportComplaintId: row.report_complaint_id,
      wasteReportId: row.waste_report_id,
      complaintReason: row.complaint_reason,
      complaintStatus: row.complaint_status,
      refundPoints: row.refund_points,
      adminResponse: row.admin_response,
      createdAt: row.created_at,
      attachments
    }
  })

  return { data, total }
}

async function findComplaintDetail(citizenId, complaintId) {
  let query = `
    SELECT 
      rc.report_complaint_id,
      rc.waste_report_id,
      rc.complaint_reason,
      rc.complaint_status,
      rc.refund_points,
      rc.admin_response,
      rc.created_at,
      rc.resolved_at,
      rc.is_updated,
      GROUP_CONCAT(rca.file_uri SEPARATOR '|||') AS attachment_uris
    FROM reportcomplaint rc
    LEFT JOIN reportcomplaintattachment rca ON rc.report_complaint_id = rca.report_complaint_id
    WHERE rc.report_complaint_id = ? AND rc.citizen_id = ? AND rc.is_deleted = 0
    GROUP BY rc.report_complaint_id
  `
  
  const [rows] = await db.execute(query, [complaintId, citizenId])
  
  if (rows.length === 0) return null

  const row = rows[0]
  const attachments = row.attachment_uris 
    ? row.attachment_uris.split('|||').filter(Boolean).map(uri => ({ fileUri: uri }))
    : []

  return {
    reportComplaintId: row.report_complaint_id,
    wasteReportId: row.waste_report_id,
    complaintReason: row.complaint_reason,
    complaintStatus: row.complaint_status,
    refundPoints: row.refund_points,
    adminResponse: row.admin_response,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    isUpdated: !!row.is_updated,
    attachments
  }
}

async function updateComplaint({ reportComplaintId, complaintReason, attachments }) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Update reason and set is_updated = 1
    if (complaintReason !== undefined) {
      await connection.execute(
        `UPDATE reportcomplaint 
         SET complaint_reason = ?, is_updated = 1 
         WHERE report_complaint_id = ?`,
        [complaintReason, reportComplaintId]
      )
    } else {
      // Even if reason is not updated, if images are added, it counts as 1 update
      await connection.execute(
        `UPDATE reportcomplaint 
         SET is_updated = 1 
         WHERE report_complaint_id = ?`,
        [reportComplaintId]
      )
    }

    // 2. Insert new attachments
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.fileUri) {
          const complaintAttachmentId = uuidv4()
          await connection.execute(
            `INSERT INTO reportcomplaintattachment 
              (complaint_attachment_id, report_complaint_id, file_uri, uploaded_at)
             VALUES (?, ?, ?, NOW())`,
            [complaintAttachmentId, reportComplaintId, attachment.fileUri]
          )
        }
      }
    }

    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function softDeleteComplaint(complaintId) {
  // Vì các câu query GET đều filter theo reportcomplaint.is_deleted, 
  // nên chỉ cần soft delete ở bảng chính là đủ.
  const query = `UPDATE reportcomplaint SET is_deleted = 1 WHERE report_complaint_id = ?`
  await db.execute(query, [complaintId])
  return true
}

async function findComplaintById(complaintId) {
  const [rows] = await db.execute(
    `SELECT report_complaint_id AS reportComplaintId,
            waste_report_id AS wasteReportId,
            citizen_id AS citizenId,
            complaint_status AS complaintStatus,
            is_deleted AS isDeleted
     FROM reportcomplaint 
     WHERE report_complaint_id = ? LIMIT 1`,
    [complaintId]
  )
  return rows[0] || null
}

async function resolveComplaint(connection, { complaintId, adminResponse, refundPoints, adminId }) {
  const query = `
    UPDATE reportcomplaint 
    SET complaint_status = 'RESOLVED',
        admin_response = ?,
        refund_points = ?,
        resolved_at = NOW(),
        resolved_by_admin_id = ?
    WHERE report_complaint_id = ?
  `
  await connection.execute(query, [adminResponse, refundPoints, adminId, complaintId])
}

async function rejectComplaint(connection, { complaintId, adminResponse, adminId }) {
  const query = `
    UPDATE reportcomplaint 
    SET complaint_status = 'REJECTED',
        admin_response = ?,
        resolved_at = NOW(),
        resolved_by_admin_id = ?
    WHERE report_complaint_id = ?
  `
  await connection.execute(query, [adminResponse, adminId, complaintId])
}

module.exports = {
  createComplaint,
  findComplaintByCitizenAndReport,
  findMyComplaints,
  findComplaintDetail,
  updateComplaint,
  softDeleteComplaint,
  findComplaintById,
  resolveComplaint,
  rejectComplaint
}
