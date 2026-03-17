-- Migration: Add violation tracking to citizen + penalty/weight config to rewardconfig
-- Date: 2026-03-17

-- ==================== Citizen Violation Tracking ====================
ALTER TABLE citizen ADD COLUMN IF NOT EXISTS spam_violation_count INT NOT NULL DEFAULT 0;
ALTER TABLE citizen ADD COLUMN IF NOT EXISTS fake_violation_count INT NOT NULL DEFAULT 0;
ALTER TABLE citizen ADD COLUMN IF NOT EXISTS total_violation_count INT NOT NULL DEFAULT 0;
ALTER TABLE citizen ADD COLUMN IF NOT EXISTS last_violation_at DATETIME NULL DEFAULT NULL;
ALTER TABLE citizen ADD COLUMN IF NOT EXISTS report_blocked_until DATETIME NULL DEFAULT NULL;
ALTER TABLE citizen ADD COLUMN IF NOT EXISTS last_penalty_level INT NOT NULL DEFAULT 0;

-- ==================== RewardConfig Extensions ====================
ALTER TABLE rewardconfig ADD COLUMN IF NOT EXISTS penalty_percent INT NOT NULL DEFAULT 30;
ALTER TABLE rewardconfig ADD COLUMN IF NOT EXISTS min_kg_required DECIMAL(10,2) NOT NULL DEFAULT 0.50;
ALTER TABLE rewardconfig ADD COLUMN IF NOT EXISTS max_kg_required DECIMAL(10,2) NULL DEFAULT NULL;

-- ==================== Update existing configs with defaults ====================
UPDATE rewardconfig SET penalty_percent = 30 WHERE penalty_percent = 0;
UPDATE rewardconfig SET min_kg_required = 0.50 WHERE min_kg_required = 0;
