import { api } from '../api.js';
import { STATUS_OPTIONS } from '../constants.js';
import { statusLabel, showToast } from '../utils.js';

const DRAFT_KEY = 'sos_admin_draft_incident';
let draftTimer = null;

export function createFormMarkup() {
  return `<section id="create-view" class="view hidden"><article class="panel form-panel"><p class="kicker">FIELD REPORT</p><h2>Create incident</h2><p class="muted">Add a report directly to the operations queue.</p><p id="draft-hint" class="muted hidden">Draft restored from your last unsaved session.</p><form id="create-form" class="create-form"><label>Species<input id="create-species" required placeholder="Example: deer"></label><div class="two-fields"><label>Latitude<input id="create-lat" type="number" step="any" min="-90" max="90" required></label><label>Longitude<input id="create-lng" type="number" step="any" min="-180" max="180" required></label></div><label>Status<select id="create-status">${STATUS_OPTIONS.map((status) => `<option value="${status}">${statusLabel(status)}</option>`).join('')}</select></label><button class="button primary" type="submit">Create incident</button><p id="create-error" class="form-error"></p></form></article></section>`;
}

function readDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function saveDraft() {
  const draft = {
    species: document.querySelector('#create-species')?.value || '',
    lat: document.querySelector('#create-lat')?.value || '',
    lng: document.querySelector('#create-lng')?.value || '',
    status: document.querySelector('#create-status')?.value || '',
  };
  if (!draft.species && !draft.lat && !draft.lng) { clearDraft(); return; }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function bindCreateForm({ onCreated, showView }) {
  const form = document.querySelector('#create-form');
  const draft = readDraft();
  if (draft) {
    document.querySelector('#create-species').value = draft.species || '';
    document.querySelector('#create-lat').value = draft.lat || '';
    document.querySelector('#create-lng').value = draft.lng || '';
    if (draft.status) document.querySelector('#create-status').value = draft.status;
    document.querySelector('#draft-hint').classList.remove('hidden');
  }
  form.addEventListener('input', () => {
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(saveDraft, 400);
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.querySelector('#create-error');
    const body = {
      species: document.querySelector('#create-species').value.trim(),
      lat: Number(document.querySelector('#create-lat').value),
      lng: Number(document.querySelector('#create-lng').value),
      status: document.querySelector('#create-status').value,
    };
    if (!body.species || !Number.isFinite(body.lat) || !Number.isFinite(body.lng)) {
      error.textContent = 'Species and valid coordinates are required.';
      return;
    }
    try {
      await api('/incidents', { method: 'POST', body: JSON.stringify(body) });
      form.reset();
      clearDraft();
      document.querySelector('#draft-hint')?.classList.add('hidden');
      error.textContent = '';
      showToast('Incident created');
      showView('signals');
      await onCreated();
    } catch (requestError) {
      error.textContent = requestError.message;
    }
  });
}
