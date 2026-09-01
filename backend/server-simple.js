require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3333;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// In-memory storage for testing
let users = [
  { id: 1, email: 'admin@puten-pazitel.local', password: '$2a$10$YourHashedPasswordHere', role: 'admin' },
  { id: 2, email: 'test@user.com', password: '$2a$10$YourHashedPasswordHere', role: 'reporter' }
];

let incidents = [
  { id: 1, lat: 42.7339, lng: 25.4858, status: 'wounded', species: 'Лисица', reporter_email: 'test@user.com', created_at: new Date().toISOString() },
  { id: 2, lat: 42.7500, lng: 25.5000, status: 'deceased', species: 'Елен', reporter_email: 'test@user.com', created_at: new Date().toISOString() }
];

let nextIncidentId = 3;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Helper to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // For testing, accept any password for existing users
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role = 'reporter' } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    email,
    password: hashedPassword,
    role
  };
  
  users.push(newUser);
  
  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
});

// Incident routes
app.get('/api/incidents', verifyToken, (req, res) => {
  const { status } = req.query;
  let filtered = incidents;
  if (status) {
    filtered = incidents.filter(i => i.status === status);
  }
  res.json(filtered);
});

app.get('/api/incidents/:id', verifyToken, (req, res) => {
  const incident = incidents.find(i => i.id === parseInt(req.params.id));
  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  res.json(incident);
});

app.post('/api/incidents', verifyToken, (req, res) => {
  const { lat, lng, species, status = 'wounded' } = req.body;
  
  const newIncident = {
    id: nextIncidentId++,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    status,
    species,
    reporter_email: req.user.email,
    created_at: new Date().toISOString(),
    admin_notes: ''
  };
  
  incidents.push(newIncident);
  res.status(201).json(newIncident);
});

app.patch('/api/incidents/:id', verifyToken, (req, res) => {
  const index = incidents.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Incident not found' });
  
  incidents[index] = { ...incidents[index], ...req.body };
  res.json(incidents[index]);
});

app.delete('/api/incidents/:id', verifyToken, (req, res) => {
  const index = incidents.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Incident not found' });
  
  incidents.splice(index, 1);
  res.json({ message: 'Incident deleted' });
});

app.listen(PORT, () => {
  console.log(`Simple backend running on http://localhost:${PORT}`);
  console.log(`API accessible at http://localhost:${PORT}/api`);
  console.log('Test credentials:');
  console.log('  Email: admin@puten-pazitel.local, Password: any');
  console.log('  Email: test@user.com, Password: any');
});
