require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'roadguardian';

  const root = await mysql.createConnection({ host, user, password, charset: 'utf8mb4' });
  await root.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await root.end();

  const db = await mysql.createConnection({ host, user, password, database, charset: 'utf8mb4' });

  await db.query(
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('guest', 'reporter', 'admin') DEFAULT 'reporter',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  );

  await db.query(
    `CREATE TABLE IF NOT EXISTS incidents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lat DOUBLE NOT NULL,
      lng DOUBLE NOT NULL,
      status VARCHAR(32) NOT NULL,
      species VARCHAR(100),
      photo_url VARCHAR(255),
      reporter_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  );

  const adminEmail = 'admin@puten-pazitel.local';
  const adminPass = 'admin123';
  const hashed = await bcrypt.hash(adminPass, 10);

  await db.execute(
    'INSERT IGNORE INTO users (email, password, role) VALUES (?, ?, ?) ',
    [adminEmail, hashed, 'admin']
  );

  // Add test user
  const testEmail = 'test@user.com';
  const testPass = 'password123';
  const hashedTest = await bcrypt.hash(testPass, 10);

  await db.execute(
    'INSERT IGNORE INTO users (email, password, role) VALUES (?, ?, ?) ',
    [testEmail, hashedTest, 'reporter']
  );

  await db.end();
  console.log('DB initialized. Admin user ready:', adminEmail);
}

main().catch((err) => {
  console.error('db_init failed:', err);
  process.exitCode = 1;
});
