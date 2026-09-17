export const state = {
  incidents: [],
  selected: new Set(),
  grid: null,
  map: null,
  socket: null,
  mutationId: null,
  theme: localStorage.getItem('sos_admin_theme') || 'light',
  history: { undo: [], redo: [] },
  intelligence: { heatmap: [], alertZones: [] },
};
