import { STATUS_LABELS } from './constants.js';

export function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function statusLabel(value) {
  return STATUS_LABELS[value] || value || 'Unknown';
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-GB') : '-';
}

export function showToast(message, error = false) {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${error ? 'error' : 'show'}`;
  window.setTimeout(() => { toast.className = 'toast'; }, 2600);
}

export function setConnection(text, tone = '') {
  const node = document.querySelector('#connection');
  if (node) { node.textContent = text; node.className = `connection ${tone}`; }
}
