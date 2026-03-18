-- Add is_duplicate column to wastereport table to support spam prevention
-- This column flags whether a report is considered a duplicate of another recent report

ALTER TABLE wastereport
ADD COLUMN IF NOT EXISTS is_duplicate TINYINT(1) DEFAULT 0 COMMENT '1 = duplicate, 0 = valid';
