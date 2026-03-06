# Admin User Management - Deployment Checklist

## ✅ Pre-Deployment

### Code Review

- [ ] All files created/modified according to spec
- [ ] No syntax errors (`npm run lint` passes)
- [ ] Code follows project conventions
- [ ] Comments/documentation clear and accurate

### Files Modified/Created

- [x] `migrations/001_add_admin_user_management_fields.sql` - Database schema
- [x] `src/repositories/userRepository.js` - Enhanced with filtering
- [x] `src/services/adminService.js` - Complete implementation
- [x] `src/controllers/adminController.js` - HTTP handlers updated
- [x] `src/utils/adminValidation.js` - Validation helpers
- [x] `src/routes/adminRoutes.js` - Verified (no changes needed)
- [x] `ADMIN_USER_MANAGEMENT_API.md` - API documentation
- [x] `IMPLEMENTATION_GUIDE.md` - Setup & testing guide
- [x] `ADMIN_USER_MANAGEMENT_SUMMARY.md` - Overview & summary
- [x] `QUICK_REFERENCE.md` - Developer quick reference

---

## 🗄️ Database Setup

### Before Deployment

```bash
# 1. Backup database
mysqldump -u root -p hoidanit > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration
mysql -u root -p hoidanit < migrations/001_add_admin_user_management_fields.sql

# 3. Verify schema
mysql -u root -p hoidanit -e "DESCRIBE UserAccount;"

# 4. Check indexes
mysql -u root -p hoidanit -e "SHOW INDEXES FROM UserAccount;"
```

### Verification Queries

```sql
-- Check new columns exist
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'UserAccount'
ORDER BY ORDINAL_POSITION;

-- Check indexes
SHOW INDEXES FROM UserAccount;

-- Test soft delete functionality
UPDATE UserAccount
SET is_deleted = 1, deleted_at = NOW()
WHERE email = 'test@example.com';

-- Verify deleted user excluded
SELECT * FROM UserAccount
WHERE is_deleted = 0 AND email = 'test@example.com';
```

---

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=hoidanit

# Other
BCRYPT_SALT_ROUNDS=10
JWT_SECRET=your_secret_key
JWT_EXPIRY=1h
```

### Verify Configuration

```bash
# Test database connection
node test-db-connection.js

# Check that all imports work
node -e "require('./src/services/adminService')" && echo "✓ adminService loads"
node -e "require('./src/repositories/userRepository')" && echo "✓ userRepository loads"
```

---

## 📋 Functionality Tests

### TASK 1: GET Users with Filters

- [ ] GET /api/v1/admin/users (no filters)
- [ ] GET /api/v1/admin/users?page=1&limit=10
- [ ] GET /api/v1/admin/users?role=CITIZEN
- [ ] GET /api/v1/admin/users?isLocked=false
- [ ] GET /api/v1/admin/users?emailVerified=true
- [ ] GET /api/v1/admin/users?keyword=test
- [ ] GET /api/v1/admin/users?createdAtFrom=2026-01-01T00:00:00Z
- [ ] GET /api/v1/admin/users (verify pagination metadata)
- [ ] GET /api/v1/admin/users (verify password_hash excluded)
- [ ] GET /api/v1/admin/users/:id (single user)

### TASK 2: CREATE User

- [ ] POST with all required fields
- [ ] POST with phone (optional)
- [ ] POST without phone
- [ ] Verify response includes userAccountId
- [ ] Verify email_verified = true
- [ ] Verify is_locked = false
- [ ] Verify password hashed in database
- [ ] POST with duplicate email (should fail 409)
- [ ] POST with invalid email (should fail 400)
- [ ] POST with weak password (should fail 400)
- [ ] POST with invalid role (should fail 400)
- [ ] POST with missing required fields (should fail 400)

### TASK 3: UPDATE User

- [ ] PUT fullname only
- [ ] PUT phone only
- [ ] PUT role only
- [ ] PUT isLocked only
- [ ] PUT multiple fields
- [ ] PUT fullname with validation
- [ ] PUT role with Business Rule checks
  - [ ] Admin can change other's role
  - [ ] Admin cannot change own role (403)
  - [ ] Cannot demote last ADMIN (409)
- [ ] PUT isLocked with Business Rule checks
  - [ ] Admin can lock others
  - [ ] Admin cannot lock own account (403)
  - [ ] Cannot lock last ADMIN (409)
- [ ] PUT with invalid role (should fail 400)
- [ ] PUT non-existent user (should fail 404)
- [ ] PUT with no fields (should fail 400)

### TASK 4: DELETE User (Soft Delete)

- [ ] DELETE existing user
- [ ] Verify is_deleted = 1 in database
- [ ] Verify deleted_at timestamp set
- [ ] Verify user excluded from GET /admin/users
- [ ] DELETE own account (should fail 403)
- [ ] DELETE last ADMIN (should fail 409)
- [ ] DELETE non-existent user (should fail 404)

---

## 🔐 Security Tests

### Authentication

- [ ] Request without token → 401
- [ ] Request with invalid token → 403
- [ ] Request with expired token → 403
- [ ] Request with valid token → 200

### Authorization

- [ ] Non-ADMIN user accessing /admin/\* → 403
- [ ] ADMIN user accessing /admin/\* → 200
- [ ] Verify admin ID from token, not request body

### Business Rules

- [ ] BR-A01: Cannot delete own account
- [ ] BR-A02: Cannot change own role
- [ ] BR-A03: Cannot lock own account
- [ ] BR-A04: Cannot demote/delete/lock last ADMIN

### Data Protection

- [ ] password_hash never in response
- [ ] Sensitive fields not logged
- [ ] SQL injection prevented (parameterized queries)
- [ ] Email lowercased in storage

---

## 📊 Data Verification

### User Creation

```sql
SELECT user_account_id, fullname, email, role_id,
       is_locked, email_verified, failed_login_count,
       is_deleted, deleted_at, created_at
FROM UserAccount
LIMIT 1;

-- Verify:
-- email_verified = 1
-- is_locked = 0
-- failed_login_count = 0
-- is_deleted = 0
-- deleted_at = NULL
```

### User Update

```sql
SELECT * FROM UserAccount WHERE user_account_id = '<test_id>';
-- Verify updated fields reflect changes
```

### User Deletion

```sql
SELECT * FROM UserAccount WHERE is_deleted = 1;
-- Verify deleted_at is set
```

---

## 🧪 Integration Tests

### API Flow Test

```bash
# 1. Create admin token (from login)
ADMIN_TOKEN="your_admin_jwt_token"

# 2. Create test user
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Integration Test User",
    "email": "integration@test.com",
    "password": "TestPass123",
    "role": "CITIZEN"
  }')

USER_ID=$(echo $RESPONSE | jq -r '.data.userAccountId')
echo "Created user: $USER_ID"

# 3. Get user
curl -s -X GET "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 4. Update user
curl -s -X PUT "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ENTERPRISE"}' | jq

# 5. Delete user
curl -s -X DELETE "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### Filtering Test

```bash
ADMIN_TOKEN="your_admin_jwt_token"

# Test each filter
curl -s -X GET "http://localhost:3000/api/v1/admin/users?role=CITIZEN" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data | length'

curl -s -X GET "http://localhost:3000/api/v1/admin/users?isLocked=false" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.pagination'

curl -s -X GET "http://localhost:3000/api/v1/admin/users?keyword=test" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data[].email'
```

---

## 📈 Performance Tests

### Query Performance

```sql
-- Test indexes with EXPLAIN
EXPLAIN SELECT * FROM UserAccount
WHERE role_id = 2 AND is_locked = 0 AND is_deleted = 0;

-- Should use indexes, not full table scan

-- Test pagination with large result set
EXPLAIN SELECT * FROM UserAccount
WHERE is_deleted = 0
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### Load Testing

```bash
# Using Apache Bench (ab) - optional
ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/users

# Expected: < 200ms response time
```

---

## 📝 Documentation Checklist

- [x] API documentation (ADMIN_USER_MANAGEMENT_API.md)
- [x] Implementation guide (IMPLEMENTATION_GUIDE.md)
- [x] Quick reference (QUICK_REFERENCE.md)
- [x] Summary document (ADMIN_USER_MANAGEMENT_SUMMARY.md)
- [x] Migration file documented
- [x] Code comments added
- [x] README updated (if needed)
- [x] Deployment checklist (this file)

---

## 🚀 Deployment Steps

### Step 1: Code Review & Testing

```bash
# Run linter
npm run lint:fix

# Run any existing tests
npm test

# Manual testing (see sections above)
```

### Step 2: Database Migration

```bash
# Backup database
mysqldump -u root -p hoidanit > backup_pre_deployment.sql

# Apply migration
mysql -u root -p hoidanit < migrations/001_add_admin_user_management_fields.sql

# Verify
mysql -u root -p hoidanit -e "DESCRIBE UserAccount;" | grep -E "email_verified|failed_login_count|last_login_at|is_deleted|deleted_at"
```

### Step 3: Deploy Code

```bash
# If using git
git add .
git commit -m "feat: implement admin user management (4 tasks)"
git push origin main

# If manual deployment
cp src/repositories/userRepository.js /prod/src/repositories/
cp src/services/adminService.js /prod/src/services/
cp src/controllers/adminController.js /prod/src/controllers/
cp src/utils/adminValidation.js /prod/src/utils/
```

### Step 4: Verify Deployment

```bash
# Test endpoint is accessible
curl -X GET "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify database changes
mysql -u root -p hoidanit -e "DESCRIBE UserAccount WHERE COLUMN_NAME LIKE 'email_verified';"

# Check logs for errors
tail -f /var/log/application.log
```

### Step 5: Post-Deployment

- [ ] Monitor error logs
- [ ] Check response times
- [ ] Verify all endpoints working
- [ ] Document any issues
- [ ] Notify team of changes

---

## 🆘 Rollback Plan

If issues occur:

### Step 1: Revert Code

```bash
git revert <commit_hash>
git push origin main
```

### Step 2: Revert Database

```bash
# Option 1: Restore from backup
mysql -u root -p hoidanit < backup_pre_deployment.sql

# Option 2: Manual rollback (reverse migration)
-- Remove columns (ALTER TABLE UserAccount DROP COLUMN ...)
-- Remove indexes (DROP INDEX idx_* ON UserAccount)
```

### Step 3: Verify Rollback

```bash
mysql -u root -p hoidanit -e "DESCRIBE UserAccount;" | grep -E "email_verified"
# Should return empty (column removed)
```

---

## 📞 Support Contacts

- Database Admin: [Name/Contact]
- Backend Lead: [Name/Contact]
- DevOps: [Name/Contact]

---

## 📋 Sign-Off

| Role           | Name | Date | Signature |
| -------------- | ---- | ---- | --------- |
| Code Review    | -    | -    | ☐         |
| QA Testing     | -    | -    | ☐         |
| Database Admin | -    | -    | ☐         |
| DevOps         | -    | -    | ☐         |
| Product Owner  | -    | -    | ☐         |

---

**Deployment Ready**

- Code Status: ✅ Complete
- Documentation Status: ✅ Complete
- Test Status: ✅ Ready for Testing
- Overall Status: 🟢 Ready for Deployment

**Last Updated**: February 25, 2026
**Version**: 1.0
**EPIC**: Admin User Management
