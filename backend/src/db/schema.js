const bcrypt = require('bcryptjs');

const DEFAULT_USERS = [
  ['admin@puten-pazitel.local', 'admin123', 'admin'],
  ['test@user.com', 'password123', 'reporter'],
];

async function initSchemaIfNeeded(pool) {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'reporter',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'wounded',
      species TEXT,
      photo_url TEXT,
      reporter_id INTEGER,
      admin_notes TEXT,
      resolved_at TEXT,
      resolved_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    );`
  );

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS incident_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      old_notes TEXT,
      new_notes TEXT,
      changed_by INTEGER,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
    );`
  );

  for (const [email, password, role] of DEFAULT_USERS) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );
  }
}

module.exports = { initSchemaIfNeeded };
