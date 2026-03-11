# Admin User Management Implementation Guide

## Overview

This document provides implementation details, setup instructions, and testing guidelines for the Admin User Management system.

## Files Modified/Created

### Core Implementation Files

#### 1. Database Migration

**File**: `migrations/001_add_admin_user_management_fields.sql`

- Adds required fields to UserAccount table
- Creates indexes for query optimization

#### 2. Repository Layer

**File**: `src/repositories/userRepository.js`

- **Enhanced Methods**:
  - `findWithFilters(filters, limit, offset)` - Advanced filtering with pagination
  - `countWithFilters(filters)` - Count users matching filters
  - Updated `findByEmail()`, `findByPhone()`, `findById()` - Include new fields
  - Updated `softDeleteUser()` - Use is_deleted and deleted_at fields

#### 3. Service Layer

**File**: `src/services/adminService.js`

- **New Features**:
  - `getAllUsers()` - TASK 1: Get users with filtering and pagination
  - `getUserById()` - Get single user
  - `createUser()` - TASK 2: Create user with validation
  - `updateUser()` - TASK 3: Update user info and role
  - `deleteUser()` - TASK 4: Soft delete user
  - `changeUserRole()` - Legacy endpoint (deprecated)
  - `changeUserStatus()` - Legacy endpoint (deprecated)
- **Helper Functions**:
  - `formatUserResponse()` - Consistent response formatting
  - `getRoleNameFromId()` - Convert role ID to name
  - `getRoleIdFromName()` - Convert role name to ID

#### 4. Controller Layer

**File**: `src/controllers/adminController.js`

- Handles HTTP requests/responses
- Extracts admin ID from JWT token (`req.user.sub`)
- Passes admin ID to service layer for business rule validation

#### 5. Validation Helpers

**File**: `src/utils/adminValidation.js`

- `validateEmail()` - Email format validation
- `validatePhone()` - Phone number validation
- `validateFullname()` - Fullname requirements
- `validatePasswordStrength()` - Password validation
- `validateRole()` - Role validation
- `validateCreateUserRequest()` - Full request validation
- `validateUpdateUserRequest()` - Update request validation
- `validatePagination()` - Pagination parameters
- `validateDateRange()` - Date range validation

#### 6. Routes

**File**: `src/routes/adminRoutes.js` (unchanged, already correct)

- All endpoints properly configured
- Authentication and authorization middleware applied

### Documentation

- `ADMIN_USER_MANAGEMENT_API.md` - Complete API documentation

## Setup Instructions

### 1. Database Migration

Run the migration script to add new fields:

```sql
-- Apply migration
mysql -u root -p hoidanit < migrations/001_add_admin_user_management_fields.sql

-- Verify schema
DESC UserAccount;
```

### 2. Dependencies

All required dependencies are in `package.json`:

- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT handling
- `uuid` - UUID generation
- `mysql2/promise` - Database queries

Install if needed:

```bash
npm install
```

### 3. Environment Variables

Ensure `.env` includes:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=hoidanit
BCRYPT_SALT_ROUNDS=10
```

## Implementation Details

### Task 1: Get Users List (Task 1)

**Endpoint**: `GET /api/v1/admin/users`

**Features**:

- ✅ Pagination (page, limit)
- ✅ Filter by role (ADMIN, ENTERPRISE, COLLECTOR, CITIZEN)
- ✅ Filter by lock status (true/false)
- ✅ Filter by email verification status
- ✅ Search by keyword (fullname or email)
- ✅ Filter by date range (createdAtFrom, createdAtTo)
- ✅ Exclude password_hash from response
- ✅ Join with Role table implicitly
- ✅ Results ordered by created_at DESC

**Query Example**:

```
GET /api/v1/admin/users?page=1&limit=10&role=CITIZEN&isLocked=false&keyword=nguyen
```

**Implementation Flow**:

1. Controller receives query params
2. Service validates and builds filters object
3. Repository executes dynamic WHERE clause with filters
4. Service maps roleId to role name in response
5. Returns paginated results with pagination metadata

---

### Task 2: Create User (Task 2)

**Endpoint**: `POST /api/v1/admin/users`

**Request Validation**:

- ✅ All required fields present (fullname, email, password, role)
- ✅ Email format is valid
- ✅ Email is unique in database
- ✅ Phone format is valid (if provided)
- ✅ Password meets minimum requirements
- ✅ Role is valid (one of the 4 roles)

**Business Logic**:

- ✅ Email checked against existing users
- ✅ Password hashed with bcrypt (salt rounds from env)
- ✅ User created with email_verified = true (admin creates)
- ✅ User created with is_locked = false
- ✅ User created with failed_login_count = 0
- ✅ UUID generated for userAccountId
- ✅ Timestamp recorded for createdAt

**Request Body Example**:

```json
{
  "fullname": "Tran Van B",
  "email": "b@gmail.com",
  "phone": "0912345678",
  "password": "SecurePass123",
  "role": "COLLECTOR"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userAccountId": "uuid-here",
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

---

### Task 3: Update User (Task 3)

**Endpoint**: `PUT /api/v1/admin/users/:id`

**Updateable Fields**:

- fullname (string)
- phone (string)
- role (string: ADMIN, ENTERPRISE, COLLECTOR, CITIZEN)
- isLocked (boolean)

**Business Rules**:

- **BR-A02**: Admin cannot change their own role
- **BR-A03**: Admin cannot lock their own account
- **BR-A04**: Cannot demote/delete/lock the last ADMIN
- At least one field must be provided

**Implementation**:

```javascript
// Admin ID extracted from JWT token
const adminId = req.user.sub

// Business rule checks
if (targetUserId === adminId && role !== undefined) {
  // Cannot change own role
  throw Error('Cannot change your own role')
}

// Check last admin protection
if (targetUser.roleId === ROLES.ADMIN && newRoleId !== ROLES.ADMIN) {
  const adminCount = await userRepository.countByRole(ROLES.ADMIN)
  if (adminCount <= 1) {
    throw Error('Cannot demote the last administrator')
  }
}
```

**Request Example**:

```json
{
  "fullname": "Updated Name",
  "phone": "0988xxx",
  "role": "ENTERPRISE",
  "isLocked": true
}
```

---

### Task 4: Delete User (Task 4)

**Endpoint**: `DELETE /api/v1/admin/users/:id`

**Soft Delete Implementation**:

- Sets `is_deleted = 1`
- Records `deleted_at = NOW()`
- Does NOT hard delete data
- Preserves records for referential integrity

**Business Rules**:

- **BR-A01**: Admin cannot delete their own account
- **BR-A04**: Cannot delete the last ADMIN
- Soft delete preserves data for audit trail

**Database Update**:

```javascript
const deletedAt = new Date()
await db.execute('UPDATE UserAccount SET is_deleted = 1, deleted_at = ? WHERE user_account_id = ?', [
  deletedAt,
  userAccountId
])
```

**Query Impact**:
All queries use `WHERE is_deleted = 0` to exclude deleted users.

---

## Business Rules Summary

| ID     | Rule                                        | Impact             |
| ------ | ------------------------------------------- | ------------------ |
| BR-A01 | Admin cannot delete their own account       | DELETE endpoint    |
| BR-A02 | Admin cannot change their own role          | PUT endpoint       |
| BR-A03 | Admin cannot lock their own account         | PUT endpoint       |
| BR-A04 | Cannot demote/delete/lock the last ADMIN    | Multiple endpoints |
| BR-A05 | Only ADMIN role can access /admin/\* routes | Route middleware   |

## Testing Guide

### Setup Test Data

```javascript
// Create test users
POST /api/v1/admin/users
{
  "fullname": "Test Citizen",
  "email": "citizen@test.com",
  "password": "TestPass123",
  "role": "CITIZEN"
}

POST /api/v1/admin/users
{
  "fullname": "Test Collector",
  "email": "collector@test.com",
  "password": "TestPass123",
  "role": "COLLECTOR"
}

POST /api/v1/admin/users
{
  "fullname": "Test Enterprise",
  "email": "enterprise@test.com",
  "password": "TestPass123",
  "role": "ENTERPRISE"
}
```

### Test TASK 1: Get Users

```bash
# Get all users with pagination
curl -X GET "http://localhost:3000/api/v1/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Filter by role
curl -X GET "http://localhost:3000/api/v1/admin/users?role=CITIZEN" \
  -H "Authorization: Bearer $TOKEN"

# Search by keyword
curl -X GET "http://localhost:3000/api/v1/admin/users?keyword=test" \
  -H "Authorization: Bearer $TOKEN"

# Filter by lock status
curl -X GET "http://localhost:3000/api/v1/admin/users?isLocked=false" \
  -H "Authorization: Bearer $TOKEN"
```

### Test TASK 2: Create User

```bash
# Successful creation
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "New User",
    "email": "newuser@test.com",
    "password": "TestPass123",
    "role": "CITIZEN"
  }'

# Test duplicate email (should fail)
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Another User",
    "email": "newuser@test.com",
    "password": "TestPass123",
    "role": "CITIZEN"
  }'
```

### Test TASK 3: Update User

```bash
# Update fullname
curl -X PUT "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullname": "Updated Name"}'

# Change role
curl -X PUT "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ENTERPRISE"}'

# Lock user
curl -X PUT "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isLocked": true}'

# Test BR-A02: Cannot change own role
curl -X PUT "http://localhost:3000/api/v1/admin/users/$ADMIN_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "CITIZEN"}'
# Expected: 403 Forbidden
```

### Test TASK 4: Delete User

```bash
# Soft delete user
curl -X DELETE "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN"

# Test BR-A01: Cannot delete own account
curl -X DELETE "http://localhost:3000/api/v1/admin/users/$ADMIN_ID" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 403 Forbidden

# Verify user is soft-deleted (check database)
SELECT * FROM UserAccount WHERE user_account_id = '$USER_ID';
# Should have is_deleted = 1, deleted_at = <timestamp>
```

## Verification Checklist

### Schema

- [ ] `email_verified` column exists
- [ ] `failed_login_count` column exists
- [ ] `last_login_at` column exists
- [ ] `is_deleted` column exists
- [ ] `deleted_at` column exists
- [ ] Indexes created for performance

### Code

- [ ] `userRepository.js` has `findWithFilters()` method
- [ ] `userRepository.js` has `countWithFilters()` method
- [ ] `adminService.js` implements all 4 tasks
- [ ] `adminController.js` passes admin ID to service
- [ ] `adminValidation.js` created with helpers
- [ ] `adminRoutes.js` has all endpoints

### Functionality

- [ ] TASK 1: Get users with filters and pagination
- [ ] TASK 2: Create user with validation
- [ ] TASK 3: Update user with business rules
- [ ] TASK 4: Soft delete user
- [ ] BR-A01: Cannot delete own account
- [ ] BR-A02: Cannot change own role
- [ ] BR-A03: Cannot lock own account
- [ ] BR-A04: Cannot demote/delete last admin

### API Documentation

- [ ] ADMIN_USER_MANAGEMENT_API.md created
- [ ] All endpoints documented with examples
- [ ] Request/response examples correct
- [ ] Error responses documented
- [ ] Business rules explained

## Common Issues & Solutions

### Issue: Role mapping not working

**Solution**: Ensure ROLES constant in `constants.js` has all 4 roles:

```javascript
const ROLES = {
  ADMIN: 1,
  CITIZEN: 2,
  COLLECTOR: 3,
  ENTERPRISE: 4
}
```

### Issue: Password comparisons failing

**Solution**: Ensure you're comparing bcryptjs hashed passwords:

```javascript
const isPasswordValid = await bcrypt.compare(inputPassword, hashedPassword)
```

### Issue: Timestamp formatting inconsistent

**Solution**: Always use ISO 8601 format:

```javascript
const date = new Date()
response.createdAt = date.toISOString()
```

### Issue: Soft delete not working

**Solution**: All SELECT queries must include `WHERE is_deleted = 0`:

```javascript
const [rows] = await db.execute('SELECT * FROM UserAccount WHERE is_deleted = 0', [])
```

## Performance Optimization

### Database Indexes

```sql
-- Created by migration
CREATE INDEX idx_email_verified ON UserAccount(email_verified);
CREATE INDEX idx_is_locked ON UserAccount(is_locked);
CREATE INDEX idx_is_deleted ON UserAccount(is_deleted);
CREATE INDEX idx_role_id ON UserAccount(role_id);
CREATE INDEX idx_created_at ON UserAccount(created_at);
```

### Query Optimization Tips

1. Always use pagination for large result sets
2. Don't select unnecessary columns
3. Use indexed columns in WHERE clauses
4. Consider composite indexes for common filters

## Security Considerations

1. **Password Hashing**: Uses bcryptjs with configurable salt rounds
2. **SQL Injection**: Uses parameterized queries (prepared statements)
3. **Authorization**: All endpoints protected with role middleware
4. **Password in Response**: Never included in any response
5. **Email Normalization**: Stored as lowercase
6. **Admin ID from JWT**: Prevents spoofing user ID

## Future Enhancements

1. Add audit logging for all admin actions
2. Add email notification for user creation
3. Add bulk user import/export
4. Add user activity dashboard
5. Add role-based permission system
6. Add 2FA for admin accounts
7. Add user suspension (different from locked)
8. Add password reset functionality
