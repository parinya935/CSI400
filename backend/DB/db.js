// ---- Database Connection ----
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '10.23.251.151',
  user: process.env.DB_USER || 'Test',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'liftcare',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
export default pool;