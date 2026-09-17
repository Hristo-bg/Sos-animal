const { state } = require('../db/state');

async function recordIncidentHistory(incidentId, action, userId, changes = {}) {
  await state.pool.execute(
    `INSERT INTO incident_history
      (incident_id, action, old_status, new_status, old_notes, new_notes, changed_by, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      incidentId,
      action,
      changes.oldStatus || null,
      changes.newStatus || null,
      changes.oldNotes || null,
      changes.newNotes || null,
      userId || null,
      JSON.stringify(changes.metadata || {}),
    ]
  );
}

module.exports = { recordIncidentHistory };
