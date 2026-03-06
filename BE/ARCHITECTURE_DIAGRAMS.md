# API Architecture & Data Flow Diagrams

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                   (Admin Dashboard)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTP Requests / JSON
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────▼──────────────────────────────────────────▼───────┐
│              Express.js Server (BE)                       │
├─────────────────────────────────────────────────────────┤
│                     Routes                               │
│  GET/POST/PUT/DELETE /api/v1/admin/users                │
├─────────────────────────────────────────────────────────┤
│                 Middleware Layer                         │
│  • Authentication (verifyToken)                         │
│  • Authorization (requireRole(ADMIN))                   │
│  • Error Handler                                         │
├─────────────────────────────────────────────────────────┤
│                 Controllers                              │
│  adminController.js                                      │
│  • getAllUsers()                                         │
│  • getUserById()                                         │
│  • createUser()                                          │
│  • updateUser()                                          │
│  • deleteUser()                                          │
├─────────────────────────────────────────────────────────┤
│                   Services                               │
│  adminService.js                                         │
│  • Business Logic                                        │
│  • Validation                                            │
│  • Rule Enforcement                                      │
├─────────────────────────────────────────────────────────┤
│                  Repositories                            │
│  userRepository.js                                       │
│  • Database Queries                                      │
│  • Filtering & Pagination                               │
├─────────────────────────────────────────────────────────┤
│                   Database                               │
│  MySQL UserAccount Table                                │
└─────────────────────────────────────────────────────────┘
```

## 2. Request/Response Flow

```
Frontend HTTP Request
        │
        │ {Authorization: Bearer JWT}
        │
        ▼
┌───────────────────────────┐
│  Authentication Check     │
│  (verifyToken)            │
└───────────────────────────┘
        │
        │ Valid Token
        │
        ▼
┌───────────────────────────┐
│  Authorization Check      │
│  (requireRole: ADMIN)     │
└───────────────────────────┘
        │
        │ Is ADMIN
        │
        ▼
┌───────────────────────────┐
│  Route Handler            │
│  (adminController)        │
└───────────────────────────┘
        │
        │ Parse Request
        │ Extract Admin ID from JWT
        │
        ▼
┌───────────────────────────┐
│  Service Layer            │
│  (adminService)           │
│  • Validate Input         │
│  • Check Business Rules   │
│  • Prepare Data           │
└───────────────────────────┘
        │
        │ Valid & Authorized
        │
        ▼
┌───────────────────────────┐
│  Repository Layer         │
│  (userRepository)         │
│  • Execute Query          │
│  • Handle Database        │
└───────────────────────────┘
        │
        │ Database Result
        │
        ▼
┌───────────────────────────┐
│  Format Response          │
│  (formatUserResponse)     │
└───────────────────────────┘
        │
        │ JSON Response
        │
        ▼
╔═══════════════════════════╗
║   HTTP Response (200/201) ║
║  {success, data, ...}     ║
╚═══════════════════════════╝

If Error at any step:
        │
        ├─ Auth Error ────────────► {statusCode: 401/403}
        ├─ Validation Error ──────► {statusCode: 400}
        ├─ Business Rule Error ──► {statusCode: 403/409}
        ├─ Not Found Error ──────► {statusCode: 404}
        └─ Server Error ─────────► {statusCode: 500}
```

## 3. TASK 1: GET Users with Filtering

```
GET /api/v1/admin/users?page=1&limit=10&role=CITIZEN&keyword=test

        │
        ▼
┌──────────────────────────────────────┐
│ Query String Validation              │
│ • page → 1 (default)                 │
│ • limit → 10 (max 100)               │
│ • role → CITIZEN                     │
│ • keyword → test                     │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Build Filters Object                 │
│ {                                    │
│   roleId: 2 (CITIZEN)               │
│   keyword: "test"                    │
│ }                                    │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Dynamic SQL Query                    │
│ SELECT * FROM UserAccount            │
│ WHERE is_deleted = 0                 │
│   AND role_id = 2                    │
│   AND (fullname LIKE '%test%'        │
│        OR email LIKE '%test%')       │
│ ORDER BY created_at DESC             │
│ LIMIT 10 OFFSET 0                    │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Format Response                      │
│ Map roleId → role name               │
│ Count total matching records         │
│ Include pagination metadata          │
└──────────────────────────────────────┘
        │
        ▼
{
  "success": true,
  "data": [
    {
      "userAccountId": "uuid",
      "fullname": "Name",
      "email": "email@test.com",
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
    "limit": 10,
    "total": 120
  }
}
```

## 4. TASK 2: Create User

```
POST /api/v1/admin/users
{
  "fullname": "Tran Van B",
  "email": "b@gmail.com",
  "phone": "0912345678",
  "password": "SecurePass123",
  "role": "COLLECTOR"
}

        │
        ▼
┌──────────────────────────────────────┐
│ Input Validation                     │
│ ✓ All required fields                │
│ ✓ Email format valid                 │
│ ✓ Phone format valid                 │
│ ✓ Password strong                    │
│ ✓ Role valid                         │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Business Rule Check                  │
│ ✓ Email not duplicate                │
░ ✓ Can create user                    │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Prepare User Data                    │
│ • Generate UUID                      │
│ • Hash password (bcryptjs)           │
│ • Set defaults:                      │
│   - email_verified = 1               │
│   - is_locked = 0                    │
│   - failed_login_count = 0           │
│   - created_at = NOW()               │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ INSERT INTO UserAccount              │
│ (user_account_id, fullname,          │
│  email, phone, password_hash,        │
│  role_id, created_at)                │
│ VALUES (?, ?, ?, ?, ?, ?, ?)         │
└──────────────────────────────────────┘
        │
        ▼
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userAccountId": "550e8400-e29b-41d4-a716-446655440001",
    "fullname": "Tran Van B",
    "email": "b@gmail.com",
    "phone": "0912345678",
    "role": "COLLECTOR",
    "isLocked": false,
    "emailVerified": true,
    "failedLoginCount": 0,
    "createdAt": "2026-02-26T10:30:00.000Z"
  }
}
```

## 5. TASK 3: Update User with Business Rules

```
PUT /api/v1/admin/users/:id
{ "role": "ENTERPRISE", "isLocked": true }

        │
        ▼
┌──────────────────────────────────────┐
│ Extract Admin ID from JWT            │
│ adminId = req.user.sub               │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Business Rule: BR-A02 & BR-A03       │
│ Check if updating own account        │
│                                      │
│ if (targetId === adminId) {          │
│   if (role !== undefined) {          │
│     ❌ Cannot change own role        │
│   }                                  │
│   if (isLocked === true) {           │
│     ❌ Cannot lock own account       │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Business Rule: BR-A04                │
│ Check if demoting/locking last ADMIN │
│                                      │
│ if (targetRole === ADMIN &&          │
│     newRole !== ADMIN) {             │
│   adminCount = countByRole(ADMIN)    │
│   if (adminCount <= 1) {             │
│     ❌ Cannot demote last ADMIN      │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ All Business Rules Passed            │
│ Execute Updates                      │
│                                      │
│ UPDATE UserAccount SET               │
│   role_id = 4,                       │
│   is_locked = 1                      │
│ WHERE user_account_id = ?            │
└──────────────────────────────────────┘
        │
        ▼
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "userAccountId": "550e8400-e29b-41d4-a716-446655440000",
    "fullname": "Nguyen Van A",
    "email": "a@gmail.com",
    "phone": "0909000000",
    "role": "ENTERPRISE",
    "isLocked": true,
    "emailVerified": true,
    "failedLoginCount": 0,
    "createdAt": "2026-02-25T10:00:00.000Z",
    "lastLoginAt": "2026-02-26T08:00:00Z"
  }
}
```

## 6. Business Rule Decision Tree

```
User Action: Modify/Delete User

                    ▼
          ┌─────────────────────┐
          │ Admin doing this?   │
          └─────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    YES │                       │ NO
        │                       │
        ▼                       ▼
   BR-A02/A03              OK
   Cannot modify own
        │
        ▼
      OK ─────────────────┐
                          │
                          ▼
             ┌─────────────────────────┐
             │ Is target ADMIN?        │
             └─────────────────────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
            YES │                    │ NO
                │                    │
                ▼                    ▼
           BR-A04                 OK
        Count Admins
             │
             ▼
      ┌────────────────┐
      │ Only 1 ADMIN?  │
      └────────────────┘
             │
        ┌────┴────┐
        │         │
     YES│         │ NO
        │         │
        ▼         ▼
      ❌ OK
    Cannot     Can modify
    modify     safely
```

## 7. Database Query Pattern

```
Common Query Pattern for User List:

SELECT
  user_account_id AS userAccountId,
  fullname,
  email,
  phone,
  role_id AS roleId,
  is_locked AS isLocked,
  email_verified AS emailVerified,
  failed_login_count AS failedLoginCount,
  created_at AS createdAt,
  last_login_at AS lastLoginAt
FROM UserAccount
WHERE 1=1
  AND is_deleted = 0
  AND role_id = ? [if role filter]
  AND is_locked = ? [if isLocked filter]
  AND email_verified = ? [if emailVerified filter]
  AND (fullname LIKE ? OR email LIKE ?) [if keyword]
  AND created_at >= ? [if createdAtFrom]
  AND created_at <= ? [if createdAtTo]
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

## 8. Response Mapping

```
Database Row          →    Response Field
────────────────────────────────────────
user_account_id       →    userAccountId
fullname              →    fullname
email                 →    email
phone                 →    phone
role_id               →    role (1→ADMIN, 2→CITIZEN, etc.)
is_locked (1/0)       →    isLocked (true/false)
email_verified (1/0)  →    emailVerified (true/false)
failed_login_count    →    failedLoginCount
created_at            →    createdAt (ISO 8601)
last_login_at         →    lastLoginAt (ISO 8601)
─────────────────────────────────────────
password_hash         →    [NOT INCLUDED]
is_deleted            →    [NOT INCLUDED]
deleted_at            →    [NOT INCLUDED]
role_id (raw number)  →    [CONVERTED TO STRING]
```

## 9. Error Response Tree

```
Request Error

    ├─ Missing/Invalid Token
    │  └─ Response: {statusCode: 401, message: "..."}
    │
    ├─ User is not ADMIN
    │  └─ Response: {statusCode: 403, message: "Access denied"}
    │
    ├─ Invalid Input Data
    │  ├─ Email format invalid
    │  │  └─ {statusCode: 400, message: "Invalid email format"}
    │  ├─ Duplicate email
    │  │  └─ {statusCode: 409, message: "Email already registered"}
    │  ├─ Missing required field
    │  │  └─ {statusCode: 400, message: "... is required"}
    │  └─ Validation failed
    │     └─ {statusCode: 400, message: "Invalid ..."}
    │
    ├─ Business Rule Violation
    │  ├─ Cannot modify own role
    │  │  └─ {statusCode: 403, message: "Cannot change your own role"}
    │  ├─ Cannot delete own account
    │  │  └─ {statusCode: 403, message: "Cannot delete your own account"}
    │  ├─ Cannot demote last ADMIN
    │  │  └─ {statusCode: 409, message: "Cannot demote last administrator"}
    │  └─ Cannot lock own account
    │     └─ {statusCode: 403, message: "Cannot lock your own account"}
    │
    ├─ Resource Not Found
    │  └─ {statusCode: 404, message: "User not found"}
    │
    └─ Server Error
       └─ {statusCode: 500, message: "Internal server error"}
```

## 10. Soft Delete Implementation

```
When User Deleted:

BEFORE:
┌─────────────────────────────────┐
│ UserAccount                     │
├─────────────────────────────────┤
│ user_account_id: uuid-123       │
│ fullname: John Doe              │
│ email: john@example.com         │
│ is_deleted: 0                   │
│ deleted_at: NULL                │
└─────────────────────────────────┘

DELETE /api/v1/admin/users/uuid-123

        ▼

UPDATE UserAccount SET
  is_deleted = 1,
  deleted_at = NOW()
WHERE user_account_id = 'uuid-123'

        ▼

AFTER:
┌─────────────────────────────────┐
│ UserAccount                     │
├─────────────────────────────────┤
│ user_account_id: uuid-123       │
│ fullname: John Doe              │
│ email: john@example.com         │
│ is_deleted: 1 ✓ MARKED         │
│ deleted_at: 2026-02-26 10:30:00 │
└─────────────────────────────────┘

        ▼

All future queries automatically
exclude this user:

WHERE ... AND is_deleted = 0

Data preserved for:
✓ Audit logs
✓ Report history
✓ Point transactions
✓ Referential integrity
```

---

These diagrams show the complete flow of the Admin User Management system from request to response, including business rule enforcement and database operations.
