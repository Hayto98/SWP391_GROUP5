# Admin User Management API Documentation

## Overview

This document describes the Admin User Management API endpoints for managing user accounts in the system.

## Authentication

All endpoints require:

- **Authorization Header**: `Bearer <access_token>`
- **Admin Role**: User must have ADMIN role

## API Endpoints

### 1. Get Users List (with Filtering & Pagination)

**TASK 1: GET /api/v1/admin/users**

Get all users with optional filters and pagination.

#### Request

```http
GET /api/v1/admin/users?page=1&limit=10&role=CITIZEN&isLocked=false&keyword=nguyen&emailVerified=true
```

#### Query Parameters

| Parameter     | Type    | Required | Description                                           | Example              |
| ------------- | ------- | -------- | ----------------------------------------------------- | -------------------- |
| page          | number  | No       | Page number (default: 1)                              | 1                    |
| limit         | number  | No       | Items per page, max 100 (default: 20)                 | 10                   |
| role          | string  | No       | Filter by role: ADMIN, ENTERPRISE, COLLECTOR, CITIZEN | CITIZEN              |
| isLocked      | boolean | No       | Filter by lock status                                 | false                |
| emailVerified | boolean | No       | Filter by email verification                          | true                 |
| keyword       | string  | No       | Search in fullname or email                           | nguyen               |
| createdAtFrom | string  | No       | Filter from date (ISO 8601)                           | 2026-01-01T00:00:00Z |
| createdAtTo   | string  | No       | Filter to date (ISO 8601)                             | 2026-12-31T23:59:59Z |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "userAccountId": "550e8400-e29b-41d4-a716-446655440000",
      "fullname": "Nguyen Van A",
      "email": "a@gmail.com",
      "phone": "0909000000",
      "role": "CITIZEN",
      "isLocked": false,
      "emailVerified": true,
      "failedLoginCount": 0,
      "createdAt": "2026-02-25T10:00:00.000Z",
      "lastLoginAt": "2026-02-26T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 120
  }
}
```

#### Business Logic

- Join with Role table
- Never return `password_hash`
- Supports filtering by: role, is_locked, email_verified, created_at range
- Results ordered by created_at DESC

---

### 2. Get Single User

**GET /api/v1/admin/users/:id**

Get a specific user by ID.

#### Request

```http
GET /api/v1/admin/users/550e8400-e29b-41d4-a716-446655440000
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "userAccountId": "550e8400-e29b-41d4-a716-446655440000",
    "fullname": "Nguyen Van A",
    "email": "a@gmail.com",
    "phone": "0909000000",
    "role": "CITIZEN",
    "isLocked": false,
    "emailVerified": true,
    "failedLoginCount": 0,
    "createdAt": "2026-02-25T10:00:00.000Z",
    "lastLoginAt": "2026-02-26T08:00:00.000Z"
  }
}
```

#### Error Response (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

---

### 3. Create User

**TASK 2: POST /api/v1/admin/users**

Create a new user account (admin action).

#### Request

```http
POST /api/v1/admin/users
Content-Type: application/json

{
  "fullname": "Tran Van B",
  "email": "b@gmail.com",
  "phone": "0912345678",
  "password": "SecurePass123",
  "role": "COLLECTOR"
}
```

#### Request Body

| Field    | Type   | Required | Description         | Constraints                                   |
| -------- | ------ | -------- | ------------------- | --------------------------------------------- |
| fullname | string | Yes      | User's full name    | 2-255 characters                              |
| email    | string | Yes      | User's email        | Valid email format, must be unique            |
| phone    | string | No       | User's phone number | 10+ digits                                    |
| password | string | Yes      | User's password     | Min 6 characters                              |
| role     | string | Yes      | User's role         | One of: ADMIN, ENTERPRISE, COLLECTOR, CITIZEN |

#### Response (201 Created)

```json
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

#### Business Rules

- ✅ Email must be unique
- ✅ Password is hashed with bcrypt
- ✅ Default: `email_verified = true` (admin creates account)
- ✅ Default: `is_locked = false`
- ✅ Default: `failed_login_count = 0`

#### Error Response (409 Conflict)

```json
{
  "statusCode": 409,
  "message": "Email is already registered"
}
```

---

### 4. Update User

**TASK 3: PUT /api/v1/admin/users/:id**

Update user information (fullname, phone, role, lock status).

#### Request

```http
PUT /api/v1/admin/users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "fullname": "Nguyen Van A Updated",
  "phone": "0987654321",
  "role": "ENTERPRISE",
  "isLocked": true
}
```

#### Request Body

All fields are optional, but at least one must be provided.

| Field    | Type    | Description                                      |
| -------- | ------- | ------------------------------------------------ |
| fullname | string  | Updated fullname                                 |
| phone    | string  | Updated phone number                             |
| role     | string  | New role (ADMIN, ENTERPRISE, COLLECTOR, CITIZEN) |
| isLocked | boolean | Lock/unlock user account                         |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "userAccountId": "550e8400-e29b-41d4-a716-446655440000",
    "fullname": "Nguyen Van A Updated",
    "email": "a@gmail.com",
    "phone": "0987654321",
    "role": "ENTERPRISE",
    "isLocked": true,
    "emailVerified": true,
    "failedLoginCount": 0,
    "createdAt": "2026-02-25T10:00:00.000Z",
    "lastLoginAt": "2026-02-26T08:00:00.000Z"
  }
}
```

#### Business Rules

- **BR-A02**: Admin cannot change their own role
- **BR-A04**: Cannot demote the last ADMIN user
- **BR-A03**: Admin cannot lock their own account
- Cannot bypass last admin protection

#### Error Response (403 Forbidden)

```json
{
  "statusCode": 403,
  "message": "You cannot change your own role"
}
```

#### Error Response (409 Conflict)

```json
{
  "statusCode": 409,
  "message": "Cannot demote the last administrator"
}
```

---

### 5. Delete User (Soft Delete)

**TASK 4: DELETE /api/v1/admin/users/:id**

Soft delete a user account (marks as deleted but preserves data).

#### Request

```http
DELETE /api/v1/admin/users/550e8400-e29b-41d4-a716-446655440000
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### Business Rules

- **BR-A01**: Admin cannot delete their own account
- **BR-A04**: Cannot delete the last ADMIN user
- **Soft Delete**: Uses `is_deleted = true` and `deleted_at = NOW()`
- Preserves user data for:
  - AuditLog
  - Report history
  - PointTransaction history

#### Error Response (403 Forbidden)

```json
{
  "statusCode": 403,
  "message": "You cannot delete your own account"
}
```

#### Error Response (409 Conflict)

```json
{
  "statusCode": 409,
  "message": "Cannot delete the last administrator"
}
```

---

## Legacy Endpoints (Deprecated)

### PATCH /api/v1/admin/users/:id/role

_Use PUT /api/v1/admin/users/:id with `role` field instead_

```http
PATCH /api/v1/admin/users/:id/role
Content-Type: application/json

{
  "role": "ENTERPRISE"
}
```

### PATCH /api/v1/admin/users/:id/status

_Use PUT /api/v1/admin/users/:id with `isLocked` field instead_

```http
PATCH /api/v1/admin/users/:id/status
Content-Type: application/json

{
  "isLocked": true
}
```

---

## Database Schema Updates

### New/Updated UserAccount Fields

```sql
-- New fields added for admin management
ALTER TABLE UserAccount ADD COLUMN email_verified TINYINT(1) DEFAULT 0;
ALTER TABLE UserAccount ADD COLUMN failed_login_count INT DEFAULT 0;
ALTER TABLE UserAccount ADD COLUMN last_login_at DATETIME NULL;
ALTER TABLE UserAccount ADD COLUMN is_deleted TINYINT(1) DEFAULT 0;
ALTER TABLE UserAccount ADD COLUMN deleted_at DATETIME NULL;
```

### Recommended Indexes

```sql
ALTER TABLE UserAccount ADD INDEX idx_email_verified (email_verified);
ALTER TABLE UserAccount ADD INDEX idx_is_locked (is_locked);
ALTER TABLE UserAccount ADD INDEX idx_is_deleted (is_deleted);
ALTER TABLE UserAccount ADD INDEX idx_role_id (role_id);
ALTER TABLE UserAccount ADD INDEX idx_created_at (created_at);
```

---

## Error Handling

All errors follow standard error response format:

```json
{
  "statusCode": 400,
  "message": "Descriptive error message"
}
```

### Common Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created                              |
| 400  | Bad Request                          |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (insufficient permissions) |
| 404  | Not Found                            |
| 409  | Conflict                             |
| 500  | Server Error                         |

---

## Examples

### Example 1: Get Active Citizens

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?role=CITIZEN&isLocked=false&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Example 2: Search Users by Keyword

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?keyword=nguyen&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Example 3: Get Recently Created Users

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?createdAtFrom=2026-02-01T00:00:00Z&limit=50" \
  -H "Authorization: Bearer <token>"
```

### Example 4: Create Collector Account

```bash
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Tran Van B",
    "email": "collector@example.com",
    "phone": "0912345678",
    "password": "SecurePass123",
    "role": "COLLECTOR"
  }'
```

### Example 5: Lock User Account

```bash
curl -X PUT "http://localhost:3000/api/v1/admin/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isLocked": true
  }'
```

---

## Implementation Notes

### Response Format

- All successful responses include `"success": true`
- GET list responses include pagination info
- POST/PUT responses include the created/updated user data
- DELETE responses only include success message

### Field Mapping

- Database: `user_account_id` → Response: `userAccountId`
- Database: `is_locked` → Response: `isLocked`
- Database: `email_verified` → Response: `emailVerified`
- Database: `failed_login_count` → Response: `failedLoginCount`
- Database: `created_at` → Response: `createdAt`
- Database: `last_login_at` → Response: `lastLoginAt`
- Database: `role_id` → Response: `role` (translated to string)
- Database: `password_hash` → NEVER included in responses

### Security

- Passwords are hashed with bcrypt (salt rounds configurable via `BCRYPT_SALT_ROUNDS`)
- Admin ID obtained from JWT token (`req.user.sub`)
- All admin operations are protected by role middleware
- Email addresses stored in lowercase
- Sensitive fields never exposed in API responses
