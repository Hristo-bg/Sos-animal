const { DISPATCH_WEBHOOK_URL } = require('../config/env');

async function dispatchWoundedIncident(incident, userId) {
  const payload = {
    event: 'incident.wounded',
    occurredAt: new Date().toISOString(),
    incident: {
      id: incident.id,
      species: incident.species,
      status: incident.status,
      lat: Number(incident.lat),
      lng: Number(incident.lng),
      createdAt: incident.created_at,
    },
    actorUserId: userId,
  };
  console.log('Dispatch prepared:', JSON.stringify(payload));

  if (DISPATCH_WEBHOOK_URL) {
    try {
      await fetch(DISPATCH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Dispatch webhook failed:', error.message);
    }
  }
  return payload;
}

module.exports = { dispatchWoundedIncident };
