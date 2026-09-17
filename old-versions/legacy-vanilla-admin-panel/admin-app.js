const API_BASE = 'http://localhost:3333/api';
const TOKEN_KEY = 'sos_admin_token';
const USER_KEY = 'sos_admin_user';
const STATUS_LABELS = { wounded: 'Ранено', deceased: 'Умряло', investigating: 'Разследва се', treated: 'Лекувано', released: 'Освободено', handled: 'Изчистено', verified: 'Потвърдено', archived: 'Архивирано' };
const state = { incidents: [], view: 'overview', intelligence: { heatmap: [], alertZones: [] }, map: null, heatLayer: null };
const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || 'Заявката не беше успешна.');
  return data;
}

function showToast(message, error = false) {
  const toast = $('toast');
  toast.textContent = message;
  toast.style.background = error ? '#b83f3b' : '';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function statusLabel(status) { return STATUS_LABELS[status] || status || 'Неизвестен'; }
function statusBadge(status) { return `<span class="badge ${status === 'handled' ? 'handled' : ''}">${statusLabel(status)}</span>`; }
function formatDate(value) { return value ? new Date(value).toLocaleString('bg-BG') : '-'; }

async function login(event) {
  event.preventDefault();
  $('loginError').textContent = '';
  try {
    const data = await api('/login', { method: 'POST', body: JSON.stringify({ email: $('loginEmail').value.trim(), password: $('loginPassword').value }) });
    if (data.user?.role !== 'admin') throw new Error('Този профил няма администраторски права.');
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    showApp(data.user);
  } catch (error) { $('loginError').textContent = error.message; }
}

function showApp(user) {
  $('loginView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  $('adminIdentity').textContent = user?.email || 'Администратор';
  loadIncidents();
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  $('appView').classList.add('hidden');
  $('loginView').classList.remove('hidden');
  $('loginPassword').value = '';
}

async function loadIncidents() {
  try { state.incidents = await api('/incidents'); await loadIntelligence(); renderAll(); }
  catch (error) { showToast(error.message, true); }
}

async function loadIntelligence() {
  state.intelligence = await api('/admin/intelligence');
  renderHeatmap();
  renderAlertZones();
}

function renderHeatmap() {
  if (!window.L || !$('heatmapCanvas')) return;
  if (!state.map) {
    state.map = L.map('heatmapCanvas').setView([42.7339, 25.4858], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
  }
  if (state.heatLayer) state.map.removeLayer(state.heatLayer);
  state.heatLayer = L.heatLayer(state.intelligence.heatmap || [], { radius: 30, blur: 22, maxZoom: 12, gradient: { 0.2: '#c8ef72', 0.55: '#f0ac32', 0.8: '#e87835', 1: '#d9534f' } }).addTo(state.map);
  if (state.intelligence.heatmap?.length) state.map.fitBounds(state.intelligence.heatmap.map((point) => [point[0], point[1]]), { padding: [20, 20], maxZoom: 9 });
}

function renderAlertZones() {
  const zones = state.intelligence.alertZones || [];
  $('alertZones').innerHTML = zones.length ? zones.map((zone) => `<div class="alertZone"><div><strong>High Alert Zone · ${zone.count} сигнала</strong><small>${Number(zone.lat).toFixed(4)}, ${Number(zone.lng).toFixed(4)} · последни ${zone.windowHours} часа</small></div><div class="alertZoneAction">${escapeHtml(zone.suggestedAction)}</div></div>`).join('') : '<p class="muted">Няма активни високорискови зони за последните 72 часа.</p>';
}

function renderAll() {
  const incidents = state.incidents;
  const active = incidents.filter((item) => !['handled', 'archived', 'released'].includes(item.status));
  const today = new Date().toDateString();
  $('statTotal').textContent = incidents.length;
  $('statActive').textContent = active.length;
  $('statResolved').textContent = incidents.filter((item) => ['handled', 'archived', 'released'].includes(item.status)).length;
  $('statToday').textContent = incidents.filter((item) => new Date(item.created_at).toDateString() === today).length;
  $('recentSignals').innerHTML = incidents.slice(0, 5).map(signalSummary).join('') || '<p class="muted">Все още няма сигнали.</p>';
  renderTable();
}

function signalSummary(item) {
  return `<div class="signalRow"><div><strong>${escapeHtml(item.species || 'Неизвестно животно')}</strong><small>${formatDate(item.created_at)} · ${Number(item.lat).toFixed(4)}, ${Number(item.lng).toFixed(4)}</small></div>${statusBadge(item.status)}</div>`;
}

function renderTable() {
  const search = ($('searchSignals')?.value || '').toLowerCase();
  const filter = $('statusFilter')?.value || '';
  const filtered = state.incidents.filter((item) => {
    const text = `${item.species || ''} ${item.lat} ${item.lng}`.toLowerCase();
    return (!search || text.includes(search)) && (!filter || item.status === filter);
  });
  $('signalsTable').innerHTML = `<table class="signalTable"><thead><tr><th>Сигнал</th><th>Статус</th><th>Създаден</th><th>Действия</th></tr></thead><tbody>${filtered.map((item) => `<tr><td><strong>#${item.id} ${escapeHtml(item.species || 'Неизвестно')}</strong><br><small>${Number(item.lat).toFixed(5)}, ${Number(item.lng).toFixed(5)}</small></td><td>${statusBadge(item.status)}</td><td>${formatDate(item.created_at)}</td><td class="rowActions"><button data-action="detail" data-id="${item.id}">История</button><button data-action="resolve" data-id="${item.id}">Обработи</button><button class="danger" data-action="delete" data-id="${item.id}">Изтрий</button></td></tr>`).join('') || '<tr><td colspan="4">Няма намерени сигнали.</td></tr>'}</tbody></table>`;
}

async function openDetail(id) {
  const item = state.incidents.find((signal) => signal.id === id);
  if (!item) return;
  try {
    const history = await api(`/incidents/${id}/history`);
    $('incidentDetail').classList.remove('hidden');
    $('incidentDetail').innerHTML = `<div class="detailHead"><div><p class="eyebrow">AUDIT TIMELINE</p><h3>#${item.id} ${escapeHtml(item.species || 'Неизвестно')}</h3><p class="muted">${Number(item.lat).toFixed(5)}, ${Number(item.lng).toFixed(5)} · ${statusLabel(item.status)}</p></div><button class="secondary" data-action="close-detail">Затвори</button></div><div class="timeline">${history.map((entry) => `<article class="timelineItem"><strong>${escapeHtml(entry.action)}${entry.new_status ? ` · ${statusLabel(entry.new_status)}` : ''}</strong><small>${formatDate(entry.created_at)} · ${escapeHtml(entry.changed_by_email || 'Система')}</small>${entry.new_notes ? `<p>${escapeHtml(entry.new_notes)}</p>` : ''}</article>`).join('') || '<p class="muted">Няма записана история.</p>'}</div>`;
    $('incidentDetail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) { showToast(error.message, true); }
}

async function updateSignal(id) {
  const item = state.incidents.find((signal) => signal.id === id);
  const nextStatus = window.prompt('Нов статус: wounded, deceased, investigating, treated, released, handled', item?.status || 'handled');
  if (!nextStatus || !STATUS_LABELS[nextStatus]) return;
  const notes = window.prompt('Бележки към сигнала (по желание):', item?.admin_notes || '') || '';
  try { await api(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, admin_notes: notes }) }); showToast('Сигналът е обновен.'); await loadIncidents(); }
  catch (error) { showToast(error.message, true); }
}

async function deleteSignal(id) {
  if (!window.confirm('Сигурни ли сте, че искате да изтриете този сигнал?')) return;
  try { await api(`/incidents/${id}`, { method: 'DELETE' }); showToast('Сигналът е изтрит.'); await loadIncidents(); }
  catch (error) { showToast(error.message, true); }
}

async function createSignal(event) {
  event.preventDefault();
  try {
    const body = { species: $('createSpecies').value.trim(), lat: Number($('createLat').value), lng: Number($('createLng').value), status: $('createStatus').value };
    await api('/incidents', { method: 'POST', body: JSON.stringify(body) });
    $('createForm').reset(); showToast('Сигналът е създаден.'); navigate('signals'); await loadIncidents();
  } catch (error) { $('createError').textContent = error.message; }
}

function navigate(view) {
  state.view = view;
  document.querySelectorAll('.view').forEach((element) => element.classList.add('hidden'));
  $(`${view}View`).classList.remove('hidden');
  document.querySelectorAll('.navItem').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  $('pageTitle').textContent = { overview: 'Обзор', signals: 'Сигнали', create: 'Нов сигнал', contacts: 'Контакти' }[view];
  if (view === 'signals') renderTable();
}

function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }

document.addEventListener('DOMContentLoaded', () => {
  $('loginForm').addEventListener('submit', login);
  $('createForm').addEventListener('submit', createSignal);
  $('logoutBtn').addEventListener('click', logout);
  $('refreshBtn').addEventListener('click', loadIncidents);
  $('searchSignals').addEventListener('input', renderTable);
  $('statusFilter').addEventListener('change', renderTable);
  $('mainNav').addEventListener('click', (event) => { const button = event.target.closest('[data-view]'); if (button) navigate(button.dataset.view); });
  document.body.addEventListener('click', (event) => { const go = event.target.closest('[data-go]'); if (go) navigate(go.dataset.go); const action = event.target.closest('[data-action]'); if (!action) return; if (action.dataset.action === 'delete') deleteSignal(Number(action.dataset.id)); else if (action.dataset.action === 'detail') openDetail(Number(action.dataset.id)); else if (action.dataset.action === 'close-detail') $('incidentDetail').classList.add('hidden'); else updateSignal(Number(action.dataset.id)); });
  const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  if (localStorage.getItem(TOKEN_KEY) && user?.role === 'admin') showApp(user);
});
