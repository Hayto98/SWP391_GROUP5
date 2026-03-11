-- 003_add_report_code_and_sequence.sql

-- 1. Create the sequence table to track report numbers per year
CREATE TABLE IF NOT EXISTS reportsequence (
    year INT NOT NULL PRIMARY KEY,
    next_val INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add the new report_code column to the wastereport table
-- Ensure it can be null initially, but unique. We will backfill existing data if needed.
ALTER TABLE wastereport
ADD COLUMN report_code VARCHAR(20) UNIQUE AFTER waste_report_id;

-- Optional: If you need to backfill existing reports, you would write an update script here.
-- For now, the schema supports the new requirements.
