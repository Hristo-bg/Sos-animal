import L from 'leaflet';
import { gsap } from 'gsap';
import { STATUS_OPTIONS, NOTE_TEMPLATES } from '../constants.js';
import { api } from '../api.js';
import { escapeHtml, statusLabel, showToast } from '../utils.js';
import { mergeIncident, highlightRow } from '../grid.js';

function openEditModal(incident) {
  document.querySelector('#edit-modal')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div id="edit-modal" class="modal-backdrop"><section class="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div class="modal-header"><div><p class="kicker">MASTER EDIT</p><h2 id="edit-title">Incident #${incident.id}</h2></div><button id="modal-close" class="icon-button" aria-label="Close edit modal">×</button></div><form id="edit-form" class="edit-form"><label>Species<select id="edit-species" required><option value="deer">Deer</option><option value="fox">Fox</option><option value="dog">Dog</option><option value="cat">Cat</option><option value="other">Other</option></select></label><label>Status<select id="edit-status" required>${STATUS_OPTIONS.map((status) => `<option value="${status}" ${status === incident.status ? 'selected' : ''}>${statusLabel(status)}</option>`).join('')}</select></label><div class="two-fields"><label>Latitude<input id="edit-lat" type="number" step="any" min="-90" max="90" value="${escapeHtml(incident.lat)}" required></label><label>Longitude<input id="edit-lng" type="number" step="any" min="-180" max="180" value="${escapeHtml(incident.lng)}" required></label></div><div id="edit-map" class="edit-map"></div><label>Admin notes<select id="edit-note-template" class="note-templates" aria-label="Insert note template"><option value="">Insert template...</option>${NOTE_TEMPLATES.map((template, index) => `<option value="${index}">${escapeHtml(template.label)}</option>`).join('')}</select><textarea id="edit-notes" rows="4">${escapeHtml(incident.admin_notes || '')}</textarea></label><label>Evidence<input id="edit-evidence" type="file" accept="image/*,application/pdf"></label><p id="edit-error" class="form-error"></p><div class="modal-actions"><button type="button" id="modal-cancel" class="button secondary">Cancel</button><button type="submit" class="button primary">Save changes</button></div></form></section></div>`);
  const modal = document.querySelector('#edit-modal');
  const latInput = document.querySelector('#edit-lat');
  const lngInput = document.querySelector('#edit-lng');
  const map = L.map('edit-map', { zoomControl: false }).setView([Number(incident.lat), Number(incident.lng)], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  const marker = L.marker([Number(incident.lat), Number(incident.lng)], { draggable: true }).addTo(map);
  const syncInputs = (lat, lng) => { latInput.value = lat.toFixed(6); lngInput.value = lng.toFixed(6); };
  marker.on('dragend', () => { const point = marker.getLatLng(); syncInputs(point.lat, point.lng); });
  map.on('click', (event) => { marker.setLatLng(event.latlng); syncInputs(event.latlng.lat, event.latlng.lng); });
  const speciesSelect = document.querySelector('#edit-species');
  if (incident.species && ![...speciesSelect.options].some((option) => option.value === incident.species)) {
    speciesSelect.insertAdjacentHTML('afterbegin', `<option value="${escapeHtml(incident.species)}">${escapeHtml(incident.species)}</option>`);
  }
  speciesSelect.value = incident.species || 'other';
  const notesField = document.querySelector('#edit-notes');
  document.querySelector('#edit-note-template').addEventListener('change', (event) => {
    const template = NOTE_TEMPLATES[Number(event.target.value)];
    if (!template) return;
    notesField.value = notesField.value ? `${notesField.value}\n${template.text}` : template.text;
    event.target.value = '';
    notesField.focus();
  });
  const close = () => { map.remove(); modal.remove(); };
  document.querySelector('#modal-close').addEventListener('click', close);
  document.querySelector('#modal-cancel').addEventListener('click', close);
  document.querySelector('#edit-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const species = document.querySelector('#edit-species').value.trim();
    const lat = Number(latInput.value);
    const lng = Number(lngInput.value);
    const error = document.querySelector('#edit-error');
    if (!species || !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      error.textContent = 'Species and valid coordinates are required.';
      return;
    }
    const body = new FormData();
    body.append('species', species);
    body.append('status', document.querySelector('#edit-status').value);
    body.append('lat', String(lat));
    body.append('lng', String(lng));
    body.append('admin_notes', document.querySelector('#edit-notes').value);
    const file = document.querySelector('#edit-evidence').files[0];
    if (file) body.append('evidence', file);
    try {
      const data = await api(`/incidents/${incident.id}`, { method: 'PATCH', body });
      mergeIncident(data.incident);
      highlightRow(incident.id);
      showToast('Incident saved');
      close();
    } catch (requestError) {
      error.textContent = requestError.message;
    }
  });
  gsap.from('.edit-modal', { y: 18, opacity: 0, duration: 0.25, ease: 'power2.out' });
}

export function initEditModal() {
  document.addEventListener('sos:open-edit-modal', (event) => openEditModal(event.detail));
}
