const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3309),
    user: process.env.DB_USER || 'haittse',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'haittse',
  });

  try {
    console.log('Creating UserVerificationToken table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS UserVerificationToken (
          verification_token_id CHAR(36) PRIMARY KEY,
          user_account_id CHAR(36) NOT NULL,
          token VARCHAR(255) NOT NULL,
          verification_type VARCHAR(50) NOT NULL,
          expired_at DATETIME NOT NULL,
          is_used BOOLEAN NOT NULL DEFAULT FALSE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_verification_user 
              FOREIGN KEY (user_account_id) 
              REFERENCES UserAccount(user_account_id) 
              ON DELETE CASCADE,
          CONSTRAINT uq_verification_token UNIQUE (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
    `);
    console.log('UserVerificationToken table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await pool.end();
  }
}

run();
