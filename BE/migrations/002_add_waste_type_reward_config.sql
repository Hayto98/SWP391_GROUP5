-- Migration: Add is_active to WasteType and create RewardConfig table
-- Date: 2026-03-01

-- ==================== WasteType Updates ====================
-- Add is_active column to WasteType table if not exists
ALTER TABLE WasteType ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1;
ALTER TABLE WasteType ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE WasteType ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create index for is_active
ALTER TABLE WasteType ADD INDEX IF NOT EXISTS idx_waste_type_is_active (is_active);

-- ==================== RewardConfig Table ====================
-- Create RewardConfig table for managing reward points per waste type
CREATE TABLE IF NOT EXISTS RewardConfig (
    reward_config_id CHAR(36) PRIMARY KEY,
    waste_type_id CHAR(36) NOT NULL UNIQUE,
    points_per_unit INT NOT NULL,
    description VARCHAR(500),
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reward_waste_type
        FOREIGN KEY (waste_type_id) REFERENCES WasteType(waste_type_id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Create indexes for RewardConfig
CREATE INDEX IF NOT EXISTS idx_reward_config_is_active ON RewardConfig(is_active);
CREATE INDEX IF NOT EXISTS idx_reward_config_waste_type ON RewardConfig(waste_type_id);
