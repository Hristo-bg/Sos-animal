const mysql = require('mysql2/promise');

async function addTestData() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'roadguardian',
    charset: 'utf8mb4'
  });
  
  try {
    await pool.execute(
      `INSERT INTO incidents (lat, lng, status, species) VALUES (?, ?, ?, ?)`,
      [42.7, 25.5, 'wounded', 'Лисица']
    );
    console.log('Test incident added');
    
    await pool.execute(
      `INSERT INTO incidents (lat, lng, status, species) VALUES (?, ?, ?, ?)`,
      [42.8, 25.3, 'deceased', 'Елен']
    );
    console.log('Second test incident added');
    
  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await pool.end();
  }
}

addTestData().catch(console.error);
