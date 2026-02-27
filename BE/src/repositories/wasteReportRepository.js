const db = require('../config/database')
const { v4: uuidv4 } = require('uuid')

/**
 * Lấy danh sách báo cáo rác của một User công dân (Citizen)
 * Theo yêu cầu SCRUM-14 GET /reports/my
 */
async function findMyReports(citizenId, { fromDate, toDate, status, limit, offset }) {
  // MySQL 5.7 compatible query (No CTEs or Window Functions)
  
  let selectPart = `
    SELECT SQL_CALC_FOUND_ROWS
      wr.waste_report_id,
      wr.gps_lat,
      wr.gps_lng,
      wr.created_at,
      
      wt.waste_type_id,
      wt.waste_type_name,
      wt.unit_type,
      
      c.citizen_id,
      ua_citizen.fullname AS citizen_fullname,
      ua_citizen.phone AS citizen_phone,
      
      (
        SELECT rst.status_name
        FROM ReportStatusHistory rsh
        JOIN ReportStatusType rst ON rsh.report_status_type_id = rst.report_status_type_id
        WHERE rsh.waste_report_id = wr.waste_report_id
        ORDER BY rsh.changed_at DESC
        LIMIT 1
      ) AS current_status,
      
      (
        SELECT GROUP_CONCAT(ra.file_uri SEPARATOR '|||')
        FROM ReportAttachment ra
        WHERE ra.waste_report_id = wr.waste_report_id
      ) AS attachment_uris,
      
      cr.collector_user_account_id,
      ua_collector.fullname AS collector_fullname,
      ua_collector.phone AS collector_phone
      
    FROM WasteReport wr
    JOIN Citizen c ON wr.citizen_id = c.citizen_id
    JOIN UserAccount ua_citizen ON c.user_account_id = ua_citizen.user_account_id
    JOIN WasteType wt ON wr.waste_type_id = wt.waste_type_id
    LEFT JOIN CollectedRecord cr ON wr.waste_report_id = cr.waste_report_id
    LEFT JOIN UserAccount ua_collector ON cr.collector_user_account_id = ua_collector.user_account_id
    
    WHERE wr.citizen_id = ?
  `
  
  const queryParams = [citizenId]

  if (fromDate) {
    selectPart += ` AND wr.created_at >= ?`
    queryParams.push(fromDate)
  }

  if (toDate) {
    selectPart += ` AND wr.created_at <= ?`
    queryParams.push(toDate)
  }

  // To filter by current_status in MySQL 5.7 without repeating the correlated subquery in the WHERE clause,
  // we filter at the application level after fetching, OR we wrap the query into an outer SELECT.
  // Wrapping the whole query to allow filtering AND pagination accurately:
  
  let finalQuery = `
    SELECT SQL_CALC_FOUND_ROWS * FROM (${selectPart.replace('SQL_CALC_FOUND_ROWS', '')}) AS DerivedReports 
    WHERE 1=1
  `

  if (status) {
    if (status === 'OPEN') {
      finalQuery += ` AND (current_status = ? OR current_status IS NULL)`
    } else {
      finalQuery += ` AND current_status = ?`
    }
    queryParams.push(status)
  }

  finalQuery += ` ORDER BY created_at DESC`
  
  if (limit !== undefined && offset !== undefined) {
    finalQuery += ` LIMIT ? OFFSET ?`
    queryParams.push(Number(limit), Number(offset))
  }

  const [rows] = await db.execute(finalQuery, queryParams)
  
  // Lấy tổng số rows cho pagination
  const [countRows] = await db.execute('SELECT FOUND_ROWS() as totalCount');
  const total = countRows[0].totalCount;

  const data = rows.map(row => {
    const attachments = row.attachment_uris ? row.attachment_uris.split('|||').map(uri => ({ fileUri: uri })) : [];
    
    const statusVal = row.current_status || 'OPEN';
    
    let assignedCollector = null;
    if (statusVal === 'ASSIGNED' || statusVal === 'IN_PROGRESS' || statusVal === 'COLLECTED') {
      if (row.collector_user_account_id) {
         assignedCollector = {
          userAccountId: row.collector_user_account_id,
          fullname: row.collector_fullname,
          phone: row.collector_phone,
          avatar: null 
        }
      }
    }

    return {
      wasteReportId: row.waste_report_id,
      wasteType: {
        id: row.waste_type_id,
        name: row.waste_type_name,
        unitType: row.unit_type
      },
      citizen: {
        fullname: row.citizen_fullname,
        phone: row.citizen_phone
      },
      location: {
        lat: Number(row.gps_lat),
        lng: Number(row.gps_lng)
      },
      status: statusVal,
      createdAt: row.created_at,
      attachments: attachments,
      assignedCollector: assignedCollector
    }
  })

  return {
    data,
    total
  }
}

/**
 * Lấy chi tiết 1 báo cáo rác thải
 * Theo yêu cầu SCRUM-14 GET /reports/:id
 */
async function findReportById(reportId) {
  let query = `
    SELECT
      wr.waste_report_id,
      wr.gps_lat,
      wr.gps_lng,
      wr.created_at,
      
      wt.waste_type_id,
      wt.waste_type_name,
      wt.unit_type,
      
      c.citizen_id,
      ua_citizen.fullname AS citizen_fullname,
      ua_citizen.phone AS citizen_phone,
      
      (
        SELECT rst.status_name
        FROM ReportStatusHistory rsh
        JOIN ReportStatusType rst ON rsh.report_status_type_id = rst.report_status_type_id
        WHERE rsh.waste_report_id = wr.waste_report_id
        ORDER BY rsh.changed_at DESC
        LIMIT 1
      ) AS current_status,
      
      (
        SELECT GROUP_CONCAT(ra.file_uri SEPARATOR '|||')
        FROM ReportAttachment ra
        WHERE ra.waste_report_id = wr.waste_report_id
      ) AS attachment_uris,
      
      cr.collector_user_account_id,
      ua_collector.fullname AS collector_fullname,
      ua_collector.phone AS collector_phone
      
    FROM WasteReport wr
    JOIN Citizen c ON wr.citizen_id = c.citizen_id
    JOIN UserAccount ua_citizen ON c.user_account_id = ua_citizen.user_account_id
    JOIN WasteType wt ON wr.waste_type_id = wt.waste_type_id
    LEFT JOIN CollectedRecord cr ON wr.waste_report_id = cr.waste_report_id
    LEFT JOIN UserAccount ua_collector ON cr.collector_user_account_id = ua_collector.user_account_id
    
    WHERE wr.waste_report_id = ?
  `
  
  const [rows] = await db.execute(query, [reportId])
  
  if (rows.length === 0) return null;

  const row = rows[0];
  const attachments = row.attachment_uris ? row.attachment_uris.split('|||').map(uri => ({ fileUri: uri })) : [];
  const statusVal = row.current_status || 'OPEN';
  
  let assignedCollector = null;
  if (statusVal === 'ASSIGNED' || statusVal === 'IN_PROGRESS' || statusVal === 'COLLECTED') {
    if (row.collector_user_account_id) {
       assignedCollector = {
        userAccountId: row.collector_user_account_id,
        fullname: row.collector_fullname,
        phone: row.collector_phone,
        avatar: null 
      }
    }
  }

  return {
    wasteReportId: row.waste_report_id,
    citizenId: row.citizen_id, // include to verify ownership later in service
    wasteType: {
      id: row.waste_type_id,
      name: row.waste_type_name,
      unitType: row.unit_type
    },
    citizen: {
      fullname: row.citizen_fullname,
      phone: row.citizen_phone
    },
    location: {
      lat: Number(row.gps_lat),
      lng: Number(row.gps_lng)
    },
    status: statusVal,
    createdAt: row.created_at,
    attachments: attachments,
    assignedCollector: assignedCollector
  }
}

/**
 * Cập nhật thông tin báo cáo rác thải
 * Chỉ dùng để cập nhật các trường cơ bản (không ảnh hưởng Status)
 */
async function updateReportById(reportId, updateData) {
  const fields = []
  const values = []

  if (updateData.waste_type_id !== undefined) {
    fields.push('waste_type_id = ?')
    values.push(updateData.waste_type_id)
  }
  if (updateData.gps_lat !== undefined) {
    fields.push('gps_lat = ?')
    values.push(updateData.gps_lat)
  }
  if (updateData.gps_lng !== undefined) {
    fields.push('gps_lng = ?')
    values.push(updateData.gps_lng)
  }
  if (updateData.description !== undefined) {
    fields.push('description = ?')
    values.push(updateData.description)
  }

  // Nếu không có field nào cần update thì bypass
  if (fields.length === 0) return true;

  const query = `UPDATE WasteReport SET ${fields.join(', ')} WHERE waste_report_id = ?`
  values.push(reportId)

  const [result] = await db.execute(query, values)
  return result.affectedRows > 0
}

/**
 * Xóa một báo cáo rác thải
 * Yêu cầu xóa các bảng phụ có khóa ngoại trỏ tới WasteReport trước
 */
async function deleteReportById(reportId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Xóa CollectedRecord (nếu có - do seed script lúc nãy có gắn)
    await connection.execute('DELETE FROM CollectedRecord WHERE waste_report_id = ?', [reportId]);

    // 2. Xóa ReportAttachment
    await connection.execute('DELETE FROM ReportAttachment WHERE waste_report_id = ?', [reportId]);

    // 3. Xóa ReportStatusHistory
    await connection.execute('DELETE FROM ReportStatusHistory WHERE waste_report_id = ?', [reportId]);

    // 4. Xóa bảng cha WasteReport
    const [result] = await connection.execute('DELETE FROM WasteReport WHERE waste_report_id = ?', [reportId]);

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Lấy danh sách báo cáo bằng userId của UserAccount, do Client thường chỉ có token mang UserAccountId
 */
async function findCitizenIdByUserAccountId(userAccountId) {
  const [rows] = await db.execute('SELECT citizen_id FROM Citizen WHERE user_account_id = ?', [userAccountId]);
  return rows[0]?.citizen_id || null;
}

module.exports = {
  findMyReports,
  findReportById,
  updateReportById,
  deleteReportById,
  findCitizenIdByUserAccountId
}
