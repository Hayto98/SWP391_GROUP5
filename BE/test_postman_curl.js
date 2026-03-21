/**
 * Test Admin Resolve Complaint with curl or Postman
 * 
 * 1. Đảm bảo server đang chạy (npm run dev)
 * 2. Lấy Admin JWT Token (đăng nhập bằng tài khoản admin)
 * 3. Thay YOUR_ADMIN_TOKEN bằng token thực tế
 * 4. Thay {complaintId} bằng ID thực tế (ví dụ: 8be430b9-ca06-4e68-8688-fef30ebe2863)
 */

// Lệnh curl mẫu:
/*
curl -X PUT http://localhost:3000/api/v1/admin/report-complaints/8be430b9-ca06-4e68-8688-fef30ebe2863/resolve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adminResponse": "Duyệt khiếu nại, hoàn thành trả điểm cho người dùng.",
    "refundPoints": 25
  }'
*/

/**
 * Cấu hình Postman:
 * - Method: PUT
 * - URL: http://localhost:3000/api/v1/admin/report-complaints/8be430b9-ca06-4e68-8688-fef30ebe2863/resolve
 * - Headers:
 *     Authorization: Bearer YOUR_ADMIN_TOKEN
 *     Content-Type: application/json
 * - Body (raw JSON):
 *   {
 *     "adminResponse": "Duyệt khiếu nại, hoàn thành trả điểm cho người dùng.",
 *     "refundPoints": 25
 *   }
 */

console.log('--- Cấu hình Test Postman ---');
console.log('Method: PUT');
console.log('URL: http://localhost:3000/api/v1/admin/report-complaints/8be430b9-ca06-4e68-8688-fef30ebe2863/resolve');
console.log('Headers: { Authorization: Bearer YOUR_ADMIN_TOKEN, Content-Type: application/json }');
console.log('Body: { "adminResponse": "...", "refundPoints": 25 }');
