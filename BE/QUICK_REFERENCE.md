# Admin User Management - Quick Reference Card

## 📋 Endpoints

### GET - List Users

```
GET /api/v1/admin/users
Query: ?page=1&limit=10&role=CITIZEN&isLocked=false&keyword=search&emailVerified=true
Response: {success, data[], pagination{page,limit,total}}
```

### GET - Single User

```
GET /api/v1/admin/users/:id
Response: {success, data{}}
```

### POST - Create User

```
POST /api/v1/admin/users
Body: {fullname, email, phone?, password, role}
Response: {success, message, data{}}
Status: 201
```

### PUT - Update User

```
PUT /api/v1/admin/users/:id
Body: {fullname?, phone?, role?, isLocked?}
Response: {success, message, data{}}
```

### DELETE - Soft Delete User

```
DELETE /api/v1/admin/users/:id
Response: {success, message}
```

---

## 🔐 Security Rules

| Rule   | Effect                                  |
| ------ | --------------------------------------- |
| BR-A01 | ❌ Cannot delete own account            |
| BR-A02 | ❌ Cannot change own role               |
| BR-A03 | ❌ Cannot lock own account              |
| BR-A04 | ❌ Cannot demote/delete/lock last ADMIN |
| BR-A05 | ❌ Only ADMIN can access /admin/\*      |

---

## ✅ Validation Rules

### Fullname

- Required
- 2-255 characters

### Email

- Required
- Valid format: user@domain.com
- Must be unique

### Phone (Optional)

- 10+ digits minimum

### Password

- Required
- Minimum 6 characters
- Will be hashed with bcryptjs

### Role

- Required for CREATE
- Valid values: `ADMIN`, `CITIZEN`, `COLLECTOR`, `ENTERPRISE`

---

## 📊 Filter Parameters

| Param         | Type     | Example              |
| ------------- | -------- | -------------------- |
| role          | string   | CITIZEN              |
| isLocked      | boolean  | false                |
| emailVerified | boolean  | true                 |
| keyword       | string   | nguyen               |
| page          | number   | 1                    |
| limit         | number   | 20                   |
| createdAtFrom | ISO date | 2026-01-01T00:00:00Z |
| createdAtTo   | ISO date | 2026-12-31T23:59:59Z |

---

## 🎯 Task Reference

### TASK 1: GET /admin/users

- Filters: role, isLocked, emailVerified, keyword, dateRange
- Pagination: page, limit (max 100)
- Returns: user list with pagination metadata

### TASK 2: POST /admin/users

- Creates user with validation
- Default: email_verified=true, is_locked=false
- Hashes password
- Returns: created user data

### TASK 3: PUT /admin/users/:id

- Updates: fullname, phone, role, isLocked
- Enforces business rules
- Returns: updated user data

### TASK 4: DELETE /admin/users/:id

- Soft delete: is_deleted=1, deleted_at=NOW()
- Preserves data integrity
- Enforces last admin protection

---

## 🔧 Common curl Commands

### Get All Users

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Citizens Only

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?role=CITIZEN" \
  -H "Authorization: Bearer $TOKEN"
```

### Create User

```bash
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Nguyen Van A",
    "email": "a@example.com",
    "password": "Pass123",
    "role": "CITIZEN"
  }'
```

### Update User

```bash
curl -X PUT "http://localhost:3000/api/v1/admin/users/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ENTERPRISE"}'
```

### Delete User

```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/users/$ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📬 Response Format

### Success List

```json
{
  "success": true,
  "data": [
    {
      "userAccountId": "uuid",
      "fullname": "Name",
      "email": "user@email.com",
      "phone": "0909000000",
      "role": "CITIZEN",
      "isLocked": false,
      "emailVerified": true,
      "failedLoginCount": 0,
      "createdAt": "2026-02-25T10:00:00Z",
      "lastLoginAt": "2026-02-26T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120
  }
}
```

### Error

```json
{
  "statusCode": 400,
  "message": "Error description"
}
```

---

## 🛢️ Database Tables

### UserAccount

| Column             | Type         | Special            |
| ------------------ | ------------ | ------------------ |
| user_account_id    | UUID         | PK                 |
| fullname           | VARCHAR(255) | Required           |
| email              | VARCHAR(255) | UNIQUE             |
| phone              | VARCHAR(20)  | Optional           |
| password_hash      | VARCHAR      | Required           |
| role_id            | INT          | Foreign Key → Role |
| is_locked          | TINYINT(1)   | Default 0          |
| email_verified     | TINYINT(1)   | Default 0          |
| failed_login_count | INT          | Default 0          |
| last_login_at      | DATETIME     | Optional           |
| is_deleted         | TINYINT(1)   | Default 0          |
| deleted_at         | DATETIME     | Optional           |
| created_at         | DATETIME     | Default NOW()      |

---

## 🎨 HTTP Status Codes

| Code | Meaning      | Use Case                    |
| ---- | ------------ | --------------------------- |
| 200  | OK           | GET, PUT successful         |
| 201  | Created      | POST successful             |
| 400  | Bad Request  | Validation failed           |
| 401  | Unauthorized | Missing token               |
| 403  | Forbidden    | No permission / BR violated |
| 404  | Not Found    | User doesn't exist          |
| 409  | Conflict     | Email exists / BR violation |
| 500  | Server Error | Database/server error       |

---

## 🧪 Test Users

Create for testing:

```bash
# Admin
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Admin Test",
    "email": "admin@test.com",
    "password": "Admin123",
    "role": "ADMIN"
  }'

# Citizen
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Citizen Test",
    "email": "citizen@test.com",
    "password": "Test123",
    "role": "CITIZEN"
  }'

# Collector
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Collector Test",
    "email": "collector@test.com",
    "password": "Test123",
    "role": "COLLECTOR"
  }'

# Enterprise
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Enterprise Test",
    "email": "enterprise@test.com",
    "password": "Test123",
    "role": "ENTERPRISE"
  }'
```

---

## 🚨 Common Errors

| Error              | Cause                   | Fix                                 |
| ------------------ | ----------------------- | ----------------------------------- |
| Missing token      | No Authorization header | Add: `Authorization: Bearer $TOKEN` |
| Invalid token      | Token expired/invalid   | Get new token                       |
| Access denied      | Not ADMIN role          | Login as ADMIN                      |
| Email taken        | Email exists            | Use different email                 |
| Cannot change role | Changing own role       | Only others' roles                  |
| Cannot delete      | Last ADMIN              | Keep 1 ADMIN                        |
| User not found     | Wrong ID                | Verify ID                           |
| Validation failed  | Wrong data type         | Check request body                  |

---

## 📚 Files Reference

| File               | Purpose            |
| ------------------ | ------------------ |
| userRepository.js  | Database queries   |
| adminService.js    | Business logic     |
| adminController.js | HTTP handlers      |
| adminRoutes.js     | Route definitions  |
| adminValidation.js | Input validation   |
| constants.js       | ROLES, USER_STATUS |
| authMiddleware.js  | Token verification |
| roleMiddleware.js  | Role authorization |

---

## 🔄 Data Flow

```
HTTP Request
    ↓
adminController (parse request)
    ↓
adminService (validate + business logic)
    ↓
userRepository (database queries)
    ↓
Database
    ↓
Response (JSON)
```

---

## 📝 Notes

- All responses include `"success": true/false`
- All dates in ISO 8601 format
- Case-insensitive roles in requests
- Email stored as lowercase
- Password never returned
- Soft delete preserves data
- JWT token required for all endpoints
- Admin ID from token, not request

---

## 🆘 Need Help?

1. Check [ADMIN_USER_MANAGEMENT_API.md](ADMIN_USER_MANAGEMENT_API.md) for detailed examples
2. See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for testing and troubleshooting
3. Review [ADMIN_USER_MANAGEMENT_SUMMARY.md](ADMIN_USER_MANAGEMENT_SUMMARY.md) for overview
4. Check error message - usually describes the issue

---

**Quick Reference v1.0** | Last Updated: 2026-02-25
