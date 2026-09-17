import { state } from './state.js';

export function updateMetrics() {
  const resolved = state.incidents.filter((item) => ['handled', 'archived', 'released'].includes(item.status)).length;
  const active = state.incidents.length - resolved;
  const today = Date.now() - 24 * 60 * 60 * 1000;
  document.querySelector('#metric-total').textContent = state.incidents.length;
  document.querySelector('#metric-active').textContent = active;
  document.querySelector('#metric-resolved').textContent = resolved;
  document.querySelector('#metric-today').textContent = state.incidents.filter((item) => new Date(item.created_at).getTime() >= today).length;
}
