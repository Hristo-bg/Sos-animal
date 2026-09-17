const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { requireDb } = require('../db/state');
const upload = require('../upload');
const incidentController = require('../controllers/incidentController');

const router = express.Router();

router.get('/', requireDb, incidentController.listIncidents);
router.get('/my', authenticateToken, requireDb, incidentController.listMyIncidents);
router.post('/', authenticateToken, requireDb, upload.single('photo'), incidentController.createIncident);
router.patch('/bulk', authenticateToken, requireRole('admin', 'org'), requireDb, incidentController.bulkUpdateIncidents);
router.patch('/:id', authenticateToken, requireRole('admin', 'org'), requireDb, upload.single('evidence'), incidentController.updateIncident);
router.delete('/:id', authenticateToken, requireRole('admin'), requireDb, incidentController.deleteIncident);
router.get('/:id/history', authenticateToken, requireRole('admin', 'org'), requireDb, incidentController.getIncidentHistory);
router.get('/:id', authenticateToken, requireRole('admin', 'org'), requireDb, incidentController.getIncident);

module.exports = router;
