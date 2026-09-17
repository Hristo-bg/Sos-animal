const { state } = require('../db/state');

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function distanceKm(first, second) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(second.lat - first.lat);
  const deltaLng = toRadians(second.lng - first.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(first.lat)) * Math.cos(toRadians(second.lat)) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findHighAlertZones() {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const [incidents] = await state.pool.execute(
    'SELECT id, lat, lng, species, status, created_at FROM incidents WHERE created_at >= ? ORDER BY created_at DESC',
    [cutoff]
  );
  const zones = [];

  for (const incident of incidents) {
    const nearby = incidents.filter((candidate) => distanceKm(incident, candidate) <= 5);
    if (nearby.length <= 3) continue;
    const existing = zones.find((zone) => distanceKm(zone, incident) <= 5);
    if (existing) {
      existing.incidentIds = [...new Set([...existing.incidentIds, ...nearby.map((item) => item.id)])];
      existing.count = existing.incidentIds.length;
      continue;
    }
    zones.push({
      lat: Number(incident.lat),
      lng: Number(incident.lng),
      count: nearby.length,
      incidentIds: nearby.map((item) => item.id),
      radiusKm: 5,
      windowHours: 72,
      severity: nearby.length >= 6 ? 'critical' : 'high',
      suggestedAction: 'Изпратете екип и проверете пътния участък за повтаряща се опасност.',
    });
  }
  return zones;
}

module.exports = { distanceKm, findHighAlertZones };
