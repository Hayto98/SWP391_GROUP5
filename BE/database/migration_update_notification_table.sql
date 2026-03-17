-- Migration: Add notification_type and is_read to notification table
-- Date: 2026-03-16

ALTER TABLE notification 
ADD COLUMN notification_type VARCHAR(50) NOT NULL AFTER notification_id,
ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER message;
