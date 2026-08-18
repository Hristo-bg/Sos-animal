const mysql = require('mysql2/promise');

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    // Create database if not exists
    await connection.execute('CREATE DATABASE IF NOT EXISTS roadguardian_db');
    await connection.execute('USE roadguardian_db');

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        organization_name VARCHAR(255),
        role ENUM('user', 'org', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create incidents table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS incidents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        status ENUM('deceased', 'wounded', 'handled') NOT NULL,
        species VARCHAR(100),
        photo_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reporter_id INT,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('Database initialized: roadguardian_db, users, incidents');
  } catch (err) {
    console.error('DB init error:', err);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDB();
}

module.exports = { initDB };
