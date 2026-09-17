import { createGrid, themeQuartz } from 'ag-grid-community';
import { STATUS_OPTIONS } from './constants.js';
import { state } from './state.js';
import { api } from './api.js';
import { escapeHtml, statusLabel, formatDate, showToast } from './utils.js';
import { createCheckboxSetFilter } from './gridFilters.js';
import { updateMetrics } from './metrics.js';

const StatusSetFilter = createCheckboxSetFilter({ values: STATUS_OPTIONS, labelFor: statusLabel });
const SpeciesSetFilter = createCheckboxSetFilter({
  values: () => [...new Set(state.incidents.map((item) => item.species).filter(Boolean))].sort(),
});

export function openEditModal(incident) {
  document.dispatchEvent(new CustomEvent('sos:open-edit-modal', { detail: incident }));
}

export function renderGrid() {
  const skeleton = document.querySelector('#grid-skeleton');
  skeleton?.classList.add('hidden');
  const gridHost = document.querySelector('#incident-grid');
  if (state.grid) state.grid.destroy();
  state.grid = createGrid(gridHost, {
    theme: themeQuartz.withParams({ borderColor: '#d9dfd9', headerBackgroundColor: '#eef2ed', rowHoverColor: '#edf6ed' }),
    rowData: state.incidents,
    animateRows: true,
    rowSelection: { mode: 'multiRow', headerCheckbox: true },
    defaultColDef: { sortable: true, filter: true, resizable: true, flex: 1, minWidth: 120 },
    columnDefs: [
      { field: 'id', headerName: 'ID', maxWidth: 90, sort: 'desc' },
      { field: 'species', headerName: 'Species', editable: true, minWidth: 170, filter: SpeciesSetFilter },
      {
        field: 'status', headerName: 'Status', editable: true, cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: STATUS_OPTIONS }, filter: StatusSetFilter,
        cellRenderer: (params) => `<span class="status status-${escapeHtml(params.value)}">${escapeHtml(statusLabel(params.value))}</span>`,
      },
      { field: 'lat', headerName: 'Latitude', filter: 'agNumberColumnFilter', valueFormatter: (params) => Number(params.value).toFixed(5) },
      { field: 'lng', headerName: 'Longitude', filter: 'agNumberColumnFilter', valueFormatter: (params) => Number(params.value).toFixed(5) },
      { field: 'admin_notes', headerName: 'Admin notes', editable: true, minWidth: 220 },
      { field: 'created_at', headerName: 'Created', filter: 'agDateColumnFilter', valueFormatter: (params) => formatDate(params.value), minWidth: 180 },
      { headerName: '', maxWidth: 110, sortable: false, filter: false, cellRenderer: () => '<button class="grid-action">Edit</button>', onCellClicked: (params) => openEditModal(params.data) },
    ],
    onSelectionChanged: () => { state.selected = new Set(state.grid.getSelectedRows().map((row) => row.id)); updateSelectionUi(); },
    onCellValueChanged: (event) => saveInlineEdit(event),
    onRowDoubleClicked: (event) => openEditModal(event.data),
    getRowId: (params) => String(params.data.id),
  });
}

export function updateSelectionUi() {
  const count = state.selected.size;
  document.querySelector('#selection-count').textContent = count ? `${count} selected · press 1-8 for status` : '0 selected';
  document.querySelector('#bulk-apply').disabled = count === 0;
  const deleteButton = document.querySelector('#bulk-delete');
  if (deleteButton) deleteButton.disabled = count === 0;
}

export function updateHistoryUi() {
  document.querySelector('#undo').disabled = !state.history.undo.length;
  document.querySelector('#redo').disabled = !state.history.redo.length;
}

function rememberMutation(before, after, type = 'update') {
  state.history.undo.push({ type, before, after });
  state.history.redo = [];
  updateHistoryUi();
}

export async function saveInlineEdit(event) {
  if (event.newValue === event.oldValue) return;
  const before = { ...event.data, [event.colDef.field]: event.oldValue };
  try {
    const data = await api(`/incidents/${event.data.id}`, { method: 'PATCH', body: JSON.stringify({ status: event.data.status, species: event.data.species, admin_notes: event.data.admin_notes }) });
    mergeIncident(data.incident);
    rememberMutation([before], [data.incident]);
    highlightRow(event.data.id);
    showToast('Incident updated');
  } catch (error) {
    event.node.setDataValue(event.colDef.field, event.oldValue);
    showToast(error.message, true);
  }
}

export async function applyBulkUpdate(explicitStatus) {
  const status = explicitStatus || document.querySelector('#bulk-status').value;
  if (!status || !state.selected.size) return;
  const before = state.incidents.filter((incident) => state.selected.has(incident.id)).map((incident) => ({ ...incident }));
  try {
    const data = await api('/incidents/bulk', { method: 'PATCH', body: JSON.stringify({ ids: [...state.selected], status }) });
    state.mutationId = data.mutationId;
    data.incidents.forEach(mergeIncident);
    rememberMutation(before, data.incidents);
    renderGrid();
    showToast(`${data.incidents.length} incidents updated`);
    const select = document.querySelector('#bulk-status');
    if (select) select.value = '';
  } catch (error) {
    showToast(error.message, true);
  }
}

export async function applyBulkDelete() {
  if (!state.selected.size) return;
  const ids = [...state.selected];
  if (!window.confirm(`Delete ${ids.length} incident${ids.length > 1 ? 's' : ''}? This cannot be undone through the server, only via re-creating them.`)) return;
  const before = state.incidents.filter((incident) => ids.includes(incident.id)).map((incident) => ({ ...incident }));
  try {
    for (const id of ids) await api(`/incidents/${id}`, { method: 'DELETE' });
    ids.forEach((id) => {
      state.incidents = state.incidents.filter((item) => item.id !== id);
      state.grid?.applyTransaction({ remove: [{ id }] });
    });
    state.selected.clear();
    updateSelectionUi();
    updateMetrics();
    rememberMutation(before, [], 'delete');
    showToast(`${ids.length} incident${ids.length > 1 ? 's' : ''} deleted`);
  } catch (error) {
    showToast(error.message, true);
  }
}

// Digit keys 1-8 apply STATUS_OPTIONS[n-1] to the current selection while the grid is focused.
// Captured on document (capture phase) because AG Grid's own cell-edit-start handling
// would otherwise consume the digit keydown before it bubbles back up.
export function initHotkeys() {
  window.addEventListener('keydown', (event) => {
    if (!state.selected.size) return;
    const target = event.target;
    const isFormField = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if (isFormField && !target.closest('#incident-grid')) return;
    const digit = Number(event.key);
    if (!Number.isInteger(digit) || digit < 1 || digit > STATUS_OPTIONS.length) return;
    if (!document.querySelector('#signals-view:not(.hidden)')) return;
    event.preventDefault();
    event.stopPropagation();
    applyBulkUpdate(STATUS_OPTIONS[digit - 1]);
  }, { capture: true });
}

export async function applyHistory(direction) {
  const source = state.history[direction];
  const entry = source.pop();
  if (!entry) return;
  const target = direction === 'undo' ? state.history.redo : state.history.undo;
  try {
    if (entry.type === 'delete') {
      if (direction === 'undo') {
        // Deleted rows are gone server-side; undo re-creates them (new IDs, tracked for a symmetric redo-delete).
        entry.recreated = [];
        for (const snapshot of entry.before) {
          const data = await api('/incidents', { method: 'POST', body: JSON.stringify({ species: snapshot.species, lat: snapshot.lat, lng: snapshot.lng, status: snapshot.status }) });
          entry.recreated.push(data.incident);
          mergeIncident(data.incident);
        }
        showToast(`${entry.recreated.length} incident${entry.recreated.length > 1 ? 's' : ''} restored`);
      } else {
        for (const incident of entry.recreated || []) {
          await api(`/incidents/${incident.id}`, { method: 'DELETE' });
          state.incidents = state.incidents.filter((item) => item.id !== incident.id);
          state.grid?.applyTransaction({ remove: [{ id: incident.id }] });
        }
        updateMetrics();
        showToast('Deletion redone');
      }
    } else {
      const snapshots = direction === 'undo' ? entry.before : entry.after;
      for (const snapshot of snapshots) {
        await api(`/incidents/${snapshot.id}`, { method: 'PATCH', body: JSON.stringify({ status: snapshot.status, species: snapshot.species, lat: snapshot.lat, lng: snapshot.lng, admin_notes: snapshot.admin_notes }) });
      }
      snapshots.forEach(mergeIncident);
      showToast(direction === 'undo' ? 'Change undone' : 'Change redone');
    }
    target.push(entry);
    renderGrid();
    updateHistoryUi();
  } catch (error) {
    source.push(entry);
    updateHistoryUi();
    showToast(error.message, true);
  }
}

export function mergeIncident(incident) {
  const index = state.incidents.findIndex((item) => item.id === incident.id);
  if (index >= 0) state.incidents[index] = incident; else state.incidents.unshift(incident);
  updateMetrics();
  state.grid?.applyTransaction({ update: [incident], add: index < 0 ? [incident] : [] });
}

export function highlightRow(id) {
  const row = document.querySelector(`[row-id="${id}"]`);
  if (row) { row.classList.add('row-updated'); window.setTimeout(() => row.classList.remove('row-updated'), 1200); }
}
