-- Migration: Add fields needed for Admin User Management
-- This migration adds missing fields to UserAccount table for proper admin management

-- Add missing fields to UserAccount table
ALTER TABLE UserAccount ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) DEFAULT 0;
ALTER TABLE UserAccount ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0;
ALTER TABLE UserAccount ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL;
ALTER TABLE UserAccount ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0;
ALTER TABLE UserAccount ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;

-- Create index for common search operations
ALTER TABLE UserAccount ADD INDEX IF NOT EXISTS idx_email_verified (email_verified);
ALTER TABLE UserAccount ADD INDEX IF NOT EXISTS idx_is_locked (is_locked);
ALTER TABLE UserAccount ADD INDEX IF NOT EXISTS idx_is_deleted (is_deleted);
ALTER TABLE UserAccount ADD INDEX IF NOT EXISTS idx_role_id (role_id);
ALTER TABLE UserAccount ADD INDEX IF NOT EXISTS idx_created_at (created_at);
