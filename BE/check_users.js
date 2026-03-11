const mysql = require('mysql2/promise');
require('dotenv').config();

const bcrypt = require('bcryptjs');

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3309),
    user: process.env.DB_USER || 'haittse',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'haittse',
  });

  try {
    const [rows] = await pool.query('SELECT user_account_id, email, password_hash, is_locked FROM useraccount WHERE email = ?', ['tthanhhai@example.com']);

    console.log('User found:', rows);
    if (rows.length > 0) {
      const match = await bcrypt.compare('Password123', rows[0].password_hash);
      console.log('Password match:', match);
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  } finally {
    await pool.end();
  }
}

run();
