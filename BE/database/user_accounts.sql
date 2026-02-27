-- Schema for user_accounts table (auth)
CREATE TABLE user_accounts (
  user_account_id CHAR(36) PRIMARY KEY,
  fullname VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(255),
  password_hash VARCHAR(255),
  role_id INT NOT NULL,
  collector_reject_count INT DEFAULT 0,
  is_locked TINYINT(1) DEFAULT 0,
  email_verified TINYINT(1) DEFAULT 0,
  failed_login_count INT DEFAULT 0,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ban_reason TEXT,
  CONSTRAINT fk_user_role
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;
