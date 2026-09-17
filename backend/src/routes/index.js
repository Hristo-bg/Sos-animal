const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { requireDb, state } = require('../db/state');
const authRoutes = require('./authRoutes');
const incidentRoutes = require('./incidentRoutes');
const incidentController = require('../controllers/incidentController');
const { PORT } = require('../config/env');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'puten-pazitel-backend', port: PORT, db: state.online ? 'online' : 'offline' });
});

router.use('/', authRoutes);
router.use('/incidents', incidentRoutes);
router.get('/admin/intelligence', authenticateToken, requireRole('admin'), requireDb, incidentController.getIntelligence);

module.exports = router;
