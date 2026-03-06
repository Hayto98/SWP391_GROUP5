-- ============================================================
-- Migration: Add `note` column to CollectedRecord
-- Run this against your database before deploying the new code
-- ============================================================

ALTER TABLE CollectedRecord
  ADD COLUMN note TEXT NULL AFTER quantity_unit;

-- ============================================================
-- Verify
-- ============================================================
-- SHOW COLUMNS FROM CollectedRecord;
