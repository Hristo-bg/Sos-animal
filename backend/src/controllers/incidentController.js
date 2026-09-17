const { state } = require('../db/state');
const { asyncHandler, handleDbOrServerError } = require('../middleware/errorHandler');
const { recordIncidentHistory } = require('../services/incidentHistoryService');
const { findHighAlertZones } = require('../services/intelligenceService');
const { dispatchWoundedIncident } = require('../services/dispatchService');
const { broadcastIncident } = require('../sockets');

const VALID_STATUSES = ['wounded', 'deceased', 'handled', 'verified', 'archived', 'investigating', 'treated', 'released'];

// Status mapping for Bulgarian to English
const STATUS_MAPPING = {
  'ранено': 'wounded',
  'умряло': 'deceased',
  'изчистено': 'handled',
  wounded: 'wounded',
  deceased: 'deceased',
  handled: 'handled',
};

function newMutationId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const listIncidents = asyncHandler(async (req, res) => {
  try {
    const [rows] = await state.pool.execute('SELECT * FROM incidents ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    handleDbOrServerError(err, res);
  }
});

const listMyIncidents = asyncHandler(async (req, res) => {
  try {
    const [rows] = await state.pool.execute('SELECT * FROM incidents WHERE reporter_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    handleDbOrServerError(err, res);
  }
});

const createIncident = asyncHandler(async (req, res) => {
  const { lat, lng, status, species } = req.body;
  const reporter_id = req.user.id;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  const mappedStatus = STATUS_MAPPING[status] || status;

  try {
    const [result] = await state.pool.execute(
      'INSERT INTO incidents (lat, lng, status, species, photo_url, reporter_id) VALUES (?, ?, ?, ?, ?, ?)',
      [lat, lng, mappedStatus, species, photo_url, reporter_id]
    );
    await recordIncidentHistory(result.insertId, 'created', reporter_id, { newStatus: mappedStatus });
    const [createdRows] = await state.pool.execute('SELECT * FROM incidents WHERE id = ?', [result.insertId]);
    const createdIncident = createdRows[0] || {
      id: result.insertId,
      lat,
      lng,
      status: mappedStatus,
      species,
      created_at: new Date().toISOString(),
    };
    if (mappedStatus === 'wounded') await dispatchWoundedIncident(createdIncident, reporter_id);
    broadcastIncident('incident.created', { incident: createdIncident, actorId: reporter_id });
    res.json({ id: result.insertId, incident: createdIncident });
  } catch (err) {
    handleDbOrServerError(err, res);
  }
});

const bulkUpdateIncidents = asyncHandler(async (req, res) => {
  const ids = [...new Set((Array.isArray(req.body?.ids) ? req.body.ids : []).map(Number).filter(Number.isInteger))];
  const { status, admin_notes } = req.body || {};
  if (!ids.length || ids.length > 100) return res.status(400).json({ error: 'Provide between 1 and 100 incident IDs' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (admin_notes !== undefined && typeof admin_notes !== 'string') return res.status(400).json({ error: 'Invalid notes' });

  try {
    const updated = [];
    for (const id of ids) {
      const [existingRows] = await state.pool.execute('SELECT * FROM incidents WHERE id = ?', [id]);
      if (!existingRows.length) return res.status(404).json({ error: `Incident ${id} not found` });
      const existing = existingRows[0];
      const notes = admin_notes ?? existing.admin_notes ?? null;
      await state.pool.execute(
        'UPDATE incidents SET status = ?, admin_notes = ?, resolved_by = ?, resolved_at = ?, updated_at = ? WHERE id = ?',
        [status, notes, req.user.id, new Date(), new Date(), id]
      );
      await recordIncidentHistory(id, 'bulk_updated', req.user.id, {
        oldStatus: existing.status,
        newStatus: status,
        oldNotes: existing.admin_notes,
        newNotes: notes,
        metadata: { fields: ['status', 'admin_notes'], mutation: 'bulk' },
      });
      const [rows] = await state.pool.execute('SELECT * FROM incidents WHERE id = ?', [id]);
      updated.push(rows[0]);
    }
    const mutationId = newMutationId();
    broadcastIncident('incident.bulkUpdated', { incidents: updated, actorId: req.user.id, mutationId });
    res.json({ updated: true, incidents: updated, mutationId });
  } catch (err) {
    handleDbOrServerError(err, res);
  }
});

const updateIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes, species } = req.body;
  const lat = req.body.lat === undefined ? undefined : Number(req.body.lat);
  const lng = req.body.lng === undefined ? undefined : Number(req.body.lng);

  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (species !== undefined && (!String(species).trim() || String(species).length > 100)) {
    return res.status(400).json({ error: 'Species is required and must be under 100 characters' });
  }
  if (
    (lat !== undefined && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
    (lng !== undefined && (!Number.isFinite(lng) || lng < -180 || lng > 180))
  ) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const [existingRows] = await state.pool.execute('SELECT * FROM incidents WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    const existing = existingRows[0];
    const updateFields = ['status = ?', 'resolved_by = ?', 'resolved_at = ?', 'updated_at = ?'];
    const updateValues = [status, req.user.id, new Date(), new Date()];
    updateFields.push('admin_notes = ?');
    updateValues.push(admin_notes ?? existing.admin_notes ?? null);
    if (species !== undefined) { updateFields.push('species = ?'); updateValues.push(String(species).trim()); }
    if (lat !== undefined) { updateFields.push('lat = ?'); updateValues.push(lat); }
    if (lng !== undefined) { updateFields.push('lng = ?'); updateValues.push(lng); }
    if (req.file) { updateFields.push('photo_url = ?'); updateValues.push(`/uploads/${req.file.filename}`); }

    await state.pool.execute(`UPDATE incidents SET ${updateFields.join(', ')} WHERE id = ?`, [...updateValues, id]);
    const [updatedRows] = await state.pool.execute('SELECT * FROM incidents WHERE id = ?', [id]);
    await recordIncidentHistory(id, 'updated', req.user.id, {
      oldStatus: existing.status,
      newStatus: status,
      oldNotes: existing.admin_notes,
      newNotes: admin_notes ?? existing.admin_notes,
      metadata: { fields: Object.keys(req.body), evidence: Boolean(req.file) },
    });
    if (existing.status !== 'wounded' && status === 'wounded') await dispatchWoundedIncident(updatedRows[0], req.user.id);
    const mutationId = newMutationId();
    broadcastIncident('incident.updated', { incident: updatedRows[0], actorId: req.user.id, mutationId });
    res.json({ updated: true, incident: updatedRows[0], mutationId });
  } catch (err) {
    handleDbOrServerError(err, res);
  }
});

const deleteIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    await recordIncidentHistory(id, 'deleted', req.user.id);
    const [result] = await state.pool.execute('DELETE FROM incidents WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Incident not found' });
    broadcastIncident('incident.deleted', { id: Number(id), actorId: req.user.id });
    res.json({ deleted: true });
  } catch (err) {
    handleDbOrServerError(err, res);
  }
});

const getIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await state.pool.execute(
      `SELECT i.*, u.email as reporter_email, r.email as resolver_email
       FROM incidents i
       LEFT JOIN users u ON i.reporter_id = u.id
       LEFT JOIN users r ON i.resolved_by = r.id
       WHERE i.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json(rows[0]);
  } catch (err) {
    handleDbOrServerError(err, res);
  }
});

const getIncidentHistory = asyncHandler(async (req, res) => {
  const [rows] = await state.pool.execute(
    `SELECT h.*, u.email AS changed_by_email
     FROM incident_history h
     LEFT JOIN users u ON h.changed_by = u.id
     WHERE h.incident_id = ?
     ORDER BY h.created_at DESC, h.id DESC`,
    [req.params.id]
  );
  res.json(rows);
});

const getIntelligence = asyncHandler(async (req, res) => {
  const [incidents] = await state.pool.execute('SELECT id, lat, lng, status, species, created_at FROM incidents ORDER BY created_at DESC');
  res.json({
    heatmap: incidents.map((item) => [Number(item.lat), Number(item.lng), item.status === 'wounded' ? 1 : 0.65]),
    alertZones: await findHighAlertZones(),
  });
});

module.exports = {
  VALID_STATUSES,
  listIncidents,
  listMyIncidents,
  createIncident,
  bulkUpdateIncidents,
  updateIncident,
  deleteIncident,
  getIncident,
  getIncidentHistory,
  getIntelligence,
};
