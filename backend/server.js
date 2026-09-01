require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5050;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Multer config for incident photos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `incident-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const DB_OFFLINE_RESPONSE = {
  status: 'error',
  code: 'DB_OFFLINE',
  message: 'Базата данни не е активна.',
};

let dbPool = null;
let dbOnline = false;

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function isDbConnectionError(err) {
  return Boolean(
    err &&
    (err.code === 'ECONNREFUSED' ||
      err.code === 'ER_BAD_DB_ERROR' ||
      err.code === 'ER_ACCESS_DENIED_ERROR' ||
      err.code === 'PROTOCOL_CONNECTION_LOST')
  );
}

async function initSchemaIfNeeded(pool) {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('guest', 'reporter', 'admin') DEFAULT 'reporter',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS incidents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lat DOUBLE NOT NULL,
      lng DOUBLE NOT NULL,
      status ENUM('wounded', 'deceased', 'handled', 'verified', 'archived', 'investigating', 'treated', 'released') NOT NULL DEFAULT 'wounded',
      species VARCHAR(100),
      photo_url VARCHAR(255),
      reporter_id INT,
      admin_notes TEXT,
      resolved_at TIMESTAMP NULL,
      resolved_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
}

async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'roadguardian';

  const root = await mysql.createConnection({ host, user, password, charset: 'utf8mb4' });
  try {
    await root.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await root.end();
  }
}

async function connectDbOnce() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'roadguardian';

  // If the database doesn't exist, create it first (prevents ER_BAD_DB_ERROR).
  await ensureDatabaseExists();

  const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    charset: 'utf8mb4',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  });

  await pool.query('SELECT 1');
  await initSchemaIfNeeded(pool);
  return pool;
}

async function startDbRetryLoop() {
  const retryMs = 5000;
  const tick = async () => {
    if (dbOnline) return;
    try {
      dbPool = await connectDbOnce();
      dbOnline = true;
      console.log('DB connected and schema ensured.');
    } catch (err) {
      dbOnline = false;
      console.warn('DB offline. Retrying in 5s...', err?.code || err?.message);
      setTimeout(tick, retryMs);
    }
  };

  tick();
}

function requireDb(req, res, next) {
  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  next();
}

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper: verify JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes

// Health check (keeps "backend is on" distinct from "db is on")
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'puten-pazitel-backend', port: PORT, db: dbOnline ? 'online' : 'offline' });
});

// Register
app.post('/api/register', asyncHandler(async (req, res) => {
  const { email, password, role = 'reporter' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await dbPool.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );
    const token = generateToken({ id: result.insertId, email, role });
    res.json({ token, user: { id: result.insertId, email, role } });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    if (isDbConnectionError(err)) {
      dbOnline = false;
      return res.status(503).json(DB_OFFLINE_RESPONSE);
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}));

// Login
app.post('/api/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  try {
    const [rows] = await dbPool.execute('SELECT id, email, password, role FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    if (isDbConnectionError(err)) {
      dbOnline = false;
      return res.status(503).json(DB_OFFLINE_RESPONSE);
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}));

// Get all incidents (public)
app.get('/api/incidents', asyncHandler(async (req, res) => {
  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  try {
    const [rows] = await dbPool.execute('SELECT * FROM incidents ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    if (isDbConnectionError(err)) {
      dbOnline = false;
      return res.status(503).json(DB_OFFLINE_RESPONSE);
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}));

// Get my incidents (authenticated)
app.get('/api/incidents/my', authenticateToken, asyncHandler(async (req, res) => {
  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  try {
    const [rows] = await dbPool.execute('SELECT * FROM incidents WHERE reporter_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    if (isDbConnectionError(err)) {
      dbOnline = false;
      return res.status(503).json(DB_OFFLINE_RESPONSE);
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}));

// Status mapping for Bulgarian to English
const statusMapping = {
  'ранено': 'wounded',
  'умряло': 'deceased',
  'изчистено': 'handled',
  'wounded': 'wounded',
  'deceased': 'deceased',
  'handled': 'handled'
};

// Create incident (auth required)
app.post('/api/incidents', authenticateToken, upload.single('photo'), asyncHandler(async (req, res) => {
  const { lat, lng, status, species } = req.body;
  const reporter_id = req.user.id;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  // Map Bulgarian status to English
  const mappedStatus = statusMapping[status] || status;

  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  try {
    const [result] = await dbPool.execute(
      'INSERT INTO incidents (lat, lng, status, species, photo_url, reporter_id) VALUES (?, ?, ?, ?, ?, ?)',
      [lat, lng, mappedStatus, species, photo_url, reporter_id]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    if (isDbConnectionError(err)) {
      dbOnline = false;
      return res.status(503).json(DB_OFFLINE_RESPONSE);
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}));

// Update incident status (admin/org required)
app.patch('/api/incidents/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;
  const validStatuses = ['wounded', 'deceased', 'handled', 'verified', 'archived', 'investigating', 'treated', 'released'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Check if user is admin or org
  if (!['admin', 'org'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin or organization access required' });
  }

  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  try {
    const updateFields = ['status = ?', 'resolved_by = ?', 'resolved_at = ?'];
    const updateValues = [status, req.user.id, new Date()];
    
    if (admin_notes) {
      updateFields.push('admin_notes = ?');
      updateValues.push(admin_notes);
    }
    
    const [result] = await dbPool.execute(
      `UPDATE incidents SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateValues, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json({ updated: true });
  } catch (err) {
    if (isDbConnectionError(err)) {
      dbOnline = false;
      return res.status(503).json(DB_OFFLINE_RESPONSE);
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}));

// Delete incident (admin only)
app.delete('/api/incidents/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  const { id } = req.params;

  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  try {
    const [result] = await dbPool.execute('DELETE FROM incidents WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json({ deleted: true });
  } catch (err) {
    if (isDbConnectionError(err)) {
      dbOnline = false;
      return res.status(503).json(DB_OFFLINE_RESPONSE);
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}));

// Get detailed incident info (admin/org required)
app.get('/api/incidents/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if user is admin or org
  if (!['admin', 'org'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin or organization access required' });
  }

  if (!dbOnline || !dbPool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  try {
    const [rows] = await dbPool.execute(`
      SELECT i.*, u.email as reporter_email, r.email as resolver_email
      FROM incidents i
      LEFT JOIN users u ON i.reporter_id = u.id
      LEFT JOIN users r ON i.resolved_by = r.id
      WHERE i.id = ?
    `, [id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json(rows[0]);
  } catch (err) {
    if (isDbConnectionError(err)) {
      dbOnline = false;
      return res.status(503).json(DB_OFFLINE_RESPONSE);
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}));

// Verify token (check if still valid)
app.post('/api/verify', authenticateToken, async (req, res) => {
  res.json({ valid: true, user: { id: req.user.id, email: req.user.email, role: req.user.role } });
});

// Central error handler
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SOS Animal Backend',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected',
    message: 'Service is running'
  });
});

app.use((err, req, res, next) => {
  console.error('API error:', err);
  if (isDbConnectionError(err)) return res.status(503).json(DB_OFFLINE_RESPONSE);
  res.status(500).json({ error: err?.message || 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`RoadGuardian backend running on http://localhost:${PORT}`);
  console.log(`API accessible at http://localhost:${PORT}/api`);
  startDbRetryLoop();
});
