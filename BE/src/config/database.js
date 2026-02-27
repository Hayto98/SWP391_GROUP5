const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3309),
  user: process.env.DB_USER || 'haittse',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'haittse',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  queueLimit: 0
})

module.exports = pool
