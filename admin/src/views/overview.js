import L from 'leaflet';
import { state } from '../state.js';
import { api } from '../api.js';
import { escapeHtml, formatDate, statusLabel, showToast } from '../utils.js';

export async function loadIntelligence() {
  try {
    state.intelligence = await api('/admin/intelligence');
  } catch (error) {
    state.intelligence = { heatmap: [], alertZones: [] };
    showToast('Intelligence data unavailable', true);
  }
}

export function renderOverview() {
  const recent = state.incidents.slice(0, 5);
  document.querySelector('#recent-list').innerHTML = recent.length
    ? recent.map((item) => `<div class="recent-row"><div><strong>#${item.id} ${escapeHtml(item.species || 'Unknown')}</strong><small>${formatDate(item.created_at)} · ${Number(item.lat).toFixed(4)}, ${Number(item.lng).toFixed(4)}</small></div><span class="status status-${escapeHtml(item.status)}">${escapeHtml(statusLabel(item.status))}</span></div>`).join('')
    : '<p class="muted">No incidents yet.</p>';
  const zones = state.intelligence?.alertZones || [];
  document.querySelector('#alert-list').innerHTML = zones.length
    ? zones.map((zone) => `<div class="recent-row"><div><strong>${zone.count} incidents in priority zone</strong><small>${Number(zone.lat).toFixed(4)}, ${Number(zone.lng).toFixed(4)} · ${zone.windowHours} hour window</small></div><span class="status status-wounded">Review</span></div>`).join('')
    : '<p class="muted">No high alert zones in the last 72 hours.</p>';
  renderOverviewMap();
}

function renderOverviewMap() {
  const points = state.intelligence?.heatmap || [];
  if (!document.querySelector('#overview-map')) return;
  if (!state.map) {
    state.map = L.map('overview-map', { zoomControl: false }).setView([42.7339, 25.4858], 7);
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
  }
  state.map.eachLayer((layer) => { if (layer instanceof L.CircleMarker) state.map.removeLayer(layer); });
  points.forEach(([lat, lng, weight]) => L.circleMarker([lat, lng], { radius: 7 + Number(weight || 0.5) * 8, color: '#b84a45', fillColor: '#e87835', fillOpacity: 0.45, weight: 1 }).addTo(state.map));
}
