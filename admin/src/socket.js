import { io } from 'socket.io-client';
import { state } from './state.js';
import { getToken } from './api.js';
import { setConnection } from './utils.js';
import { mergeIncident, highlightRow } from './grid.js';
import { updateMetrics } from './metrics.js';

export function connectSocket() {
  state.socket?.disconnect();
  state.socket = io('http://localhost:3333', { auth: { token: getToken() } });
  state.socket.on('connect', () => setConnection('Live · connected'));
  state.socket.on('disconnect', () => setConnection('Offline', 'error'));
  state.socket.on('incident.updated', ({ incident, mutationId }) => {
    if (mutationId === state.mutationId) return;
    mergeIncident(incident);
    highlightRow(incident.id);
  });
  state.socket.on('incident.bulkUpdated', ({ incidents, mutationId }) => {
    if (mutationId === state.mutationId) return;
    incidents.forEach((incident) => { mergeIncident(incident); highlightRow(incident.id); });
  });
  state.socket.on('incident.created', ({ incident }) => { mergeIncident(incident); highlightRow(incident.id); });
  state.socket.on('incident.deleted', ({ id }) => {
    state.incidents = state.incidents.filter((item) => item.id !== id);
    state.grid?.applyTransaction({ remove: [{ id }] });
    updateMetrics();
  });
}
