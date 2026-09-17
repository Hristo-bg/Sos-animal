import { gsap } from 'gsap';
import { state } from '../state.js';
import { api, clearSession } from '../api.js';
import { STATUS_OPTIONS } from '../constants.js';
import { escapeHtml, statusLabel, setConnection, showToast } from '../utils.js';
import { updateMetrics } from '../metrics.js';
import { renderGrid, applyBulkUpdate, applyBulkDelete, applyHistory, initHotkeys } from '../grid.js';
import { connectSocket } from '../socket.js';
import { loadIntelligence, renderOverview } from './overview.js';
import { createFormMarkup, bindCreateForm } from './create.js';
import { initEditModal } from './editModal.js';
import { renderLogin } from './login.js';
import { initCommandPalette, registerCommands } from '../commandPalette.js';

let globalsReady = false;

export function renderApp(user) {
  const app = document.querySelector('#admin-root');
  app.innerHTML = `<div class="app-shell" data-theme="${state.theme}">
    <aside class="sidebar" id="sidebar"><div class="brand"><span class="brand-mark">SA</span><div><strong>SOS Animal</strong><small>DATA OPERATIONS</small></div></div><nav><button class="nav-item active" data-view="overview">Overview</button><button class="nav-item" data-view="signals">Incidents</button><button class="nav-item" data-view="create">New incident</button><button class="nav-item" data-view="contacts">Contacts</button></nav><div class="sidebar-footer"><span>${escapeHtml(user?.email || 'Administrator')}</span><button id="logout" class="quiet-button">Sign out</button></div></aside>
    <main class="workspace"><header class="topbar"><div><p class="kicker">LIVE CONTROL ROOM</p><h1>Incident operations</h1></div><div class="top-actions"><span id="connection" class="connection">Connecting...</span><button id="theme-toggle" class="icon-button" title="Toggle theme" aria-label="Toggle theme">◐</button><button id="refresh" class="button secondary">Refresh</button></div></header>
      <section class="metrics"><article><span>Total incidents</span><strong id="metric-total">0</strong></article><article><span>Needs action</span><strong id="metric-active">0</strong></article><article><span>Resolved</span><strong id="metric-resolved">0</strong></article><article><span>Last 24 hours</span><strong id="metric-today">0</strong></article></section>
      <section id="overview-view" class="view"><div class="overview-grid"><article class="panel map-panel"><div class="panel-header"><div><p class="kicker">GEOSPATIAL INTELLIGENCE</p><h2>Incident density</h2></div><span class="muted">Live coordinates</span></div><div id="overview-map" class="overview-map"></div></article><article class="panel queue-panel"><div class="panel-header"><div><p class="kicker">LIVE QUEUE</p><h2>Recent incidents</h2></div><button class="text-button" data-view="signals">View register</button></div><div id="recent-list" class="recent-list"></div></article></div><article class="panel alert-panel"><div class="panel-header"><div><p class="kicker">RESPONSE PRIORITY</p><h2>High alert zones</h2></div></div><div id="alert-list" class="recent-list"></div></article></section>
      <section id="signals-view" class="view hidden"><section class="panel grid-panel"><div class="panel-header"><div><p class="kicker">INCIDENT REGISTER</p><h2>Live incident grid</h2></div><div class="bulk-actions"><span id="selection-count">0 selected</span><select id="bulk-status" aria-label="Bulk status"><option value="">Bulk status...</option>${STATUS_OPTIONS.map((status) => `<option value="${status}">${statusLabel(status)}</option>`).join('')}</select><button id="bulk-apply" class="button primary" disabled>Apply</button><button id="bulk-delete" class="button danger" disabled>Delete</button></div></div><div class="toolbar"><input id="quick-filter" placeholder="Filter species, status, coordinates..." aria-label="Filter incidents"><button id="undo" class="button secondary" disabled>Undo</button><button id="redo" class="button secondary" disabled>Redo</button><span class="muted" style="margin-left:auto;font-size:11px;">Ctrl/Cmd+K for commands · 1-8 for status</span></div><div id="grid-skeleton" class="grid-skeleton">${Array.from({ length: 7 }, () => '<span></span>').join('')}</div><div id="incident-grid" class="ag-theme-quartz"></div></section></section>
      ${createFormMarkup()}
      <section id="contacts-view" class="view hidden"><div class="contact-grid"><article class="panel contact-card"><strong>112</strong><h2>Emergency response</h2><a href="tel:112">Call 112</a></article><article class="panel contact-card"><strong>BABH</strong><h2>Food safety agency</h2><a href="tel:+35929235858">+359 2 923 58 58</a></article><article class="panel contact-card"><strong>KAT</strong><h2>Traffic police</h2><a href="tel:+35929805200">+359 2 980 52 00</a></article></div></section>
      <div id="toast" class="toast" role="status"></div>
    </main></div>`;
  bindApp(user);
  loadIncidents();
  connectSocket();
  gsap.from('.sidebar', { x: -24, opacity: 0, duration: 0.45, ease: 'power2.out' });
  gsap.from('.panel, .metrics article', { y: 12, opacity: 0, duration: 0.4, stagger: 0.05, delay: 0.1, ease: 'power2.out' });
}

function bindApp(user) {
  document.querySelector('#logout').addEventListener('click', () => { clearSession(); state.socket?.disconnect(); renderLogin(); });
  document.querySelector('#theme-toggle').addEventListener('click', () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; document.querySelector('.app-shell').dataset.theme = state.theme; localStorage.setItem('sos_admin_theme', state.theme); });
  document.querySelector('#refresh').addEventListener('click', loadIncidents);
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  document.querySelector('#quick-filter').addEventListener('input', (event) => state.grid?.setGridOption('quickFilterText', event.target.value));
  document.querySelector('#bulk-apply').addEventListener('click', () => applyBulkUpdate());
  document.querySelector('#bulk-delete').addEventListener('click', applyBulkDelete);
  document.querySelector('#undo').addEventListener('click', () => applyHistory('undo'));
  document.querySelector('#redo').addEventListener('click', () => applyHistory('redo'));
  bindCreateForm({ onCreated: loadIncidents, showView });
  if (!globalsReady) {
    initEditModal();
    initHotkeys();
    initCommandPalette();
    registerCommands([
      { label: 'Go to Overview', hint: 'View', run: () => showView('overview') },
      { label: 'Go to Incidents', hint: 'View', run: () => showView('signals') },
      { label: 'New incident', hint: 'View', run: () => showView('create') },
      { label: 'Contacts', hint: 'View', run: () => showView('contacts') },
      { label: 'Refresh data', hint: 'Action', keywords: 'reload sync', run: () => loadIncidents() },
      { label: 'Toggle theme', hint: 'Action', keywords: 'dark light', run: () => document.querySelector('#theme-toggle')?.click() },
      { label: 'Sign out', hint: 'Action', keywords: 'logout', run: () => document.querySelector('#logout')?.click() },
    ]);
    globalsReady = true;
  }
}

function showView(view) {
  document.querySelectorAll('.view').forEach((section) => section.classList.toggle('hidden', section.id !== `${view}-view`));
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  if (view === 'overview') renderOverview();
  if (view === 'signals') { renderGrid(); window.setTimeout(() => state.grid?.sizeColumnsToFit(), 0); }
  gsap.from(`#${view}-view`, { y: 10, opacity: 0, duration: 0.25, ease: 'power2.out' });
}

async function loadIncidents() {
  setConnection('Refreshing data...', 'busy');
  try {
    state.incidents = await api('/incidents');
    updateMetrics();
    renderGrid();
    await loadIntelligence();
    renderOverview();
    setConnection('Live · synced');
  } catch (error) {
    setConnection('Offline', 'error');
    showToast(error.message, true);
  }
}
