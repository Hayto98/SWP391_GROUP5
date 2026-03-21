const complaintService = require('./src/services/complaintService')
const db = require('./src/config/database')

async function test() {
  const complaintId = '8be430b9-ca06-4e68-8688-fef30ebe2863'
  const adminId = '11111111-1111-1111-1111-111111111111'
  const adminResponse = 'Collector báo sai trạng thái, đã hoàn điểm cho bạn'
  const refundPoints = 20

  try {
    console.log('Resolving complaint...')
    const result = await complaintService.resolveComplaint({
      adminId,
      complaintId,
      adminResponse,
      refundPoints
    })
    console.log('Service result:', JSON.stringify(result, null, 2))

    // Verify in DB
    const [rows] = await db.execute(
      `SELECT rc.complaint_status, rc.admin_response, rc.refund_points, c.total_points 
       FROM reportcomplaint rc 
       JOIN citizen c ON rc.citizen_id = c.citizen_id 
       WHERE rc.report_complaint_id = ?`,
      [complaintId]
    )
    console.log('DB State after resolve:', JSON.stringify(rows[0], null, 2))

    // Verify point transaction
    const [transactions] = await db.execute(
      `SELECT * FROM pointtransaction WHERE citizen_id = (SELECT citizen_id FROM reportcomplaint WHERE report_complaint_id = ?) ORDER BY created_at DESC LIMIT 1`,
      [complaintId]
    )
    console.log('Latest point transaction:', JSON.stringify(transactions[0], null, 2))

    process.exit(0)
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

test()
