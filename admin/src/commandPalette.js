import { escapeHtml } from './utils.js';

let actions = [];
let paletteEl = null;
let activeIndex = 0;

function filteredActions(query) {
  const q = query.trim().toLowerCase();
  if (!q) return actions;
  return actions.filter((action) => action.label.toLowerCase().includes(q) || action.keywords?.toLowerCase().includes(q));
}

function render(query = '') {
  const matches = filteredActions(query);
  activeIndex = Math.min(activeIndex, Math.max(matches.length - 1, 0));
  const list = paletteEl.querySelector('#command-list');
  list.innerHTML = matches.length
    ? matches.map((action, index) => `<li data-index="${index}" class="${index === activeIndex ? 'active' : ''}"><span>${escapeHtml(action.label)}</span>${action.hint ? `<small>${escapeHtml(action.hint)}</small>` : ''}</li>`).join('')
    : '<li class="empty">No matching commands</li>';
  list.querySelectorAll('li[data-index]').forEach((item) => {
    item.addEventListener('mouseenter', () => { activeIndex = Number(item.dataset.index); updateActive(); });
    item.addEventListener('click', () => runAction(matches[Number(item.dataset.index)]));
  });
  return matches;
}

function updateActive() {
  paletteEl.querySelectorAll('#command-list li[data-index]').forEach((item) => item.classList.toggle('active', Number(item.dataset.index) === activeIndex));
}

function runAction(action) {
  if (!action) return;
  close();
  action.run();
}

function close() {
  paletteEl?.remove();
  paletteEl = null;
}

function open() {
  if (paletteEl) return;
  activeIndex = 0;
  document.body.insertAdjacentHTML('beforeend', `<div id="command-palette" class="command-backdrop"><div class="command-box"><input id="command-input" placeholder="Type a command..." autocomplete="off"><ul id="command-list"></ul></div></div>`);
  paletteEl = document.querySelector('#command-palette');
  const input = paletteEl.querySelector('#command-input');
  render('');
  input.focus();
  input.addEventListener('input', () => render(input.value));
  paletteEl.addEventListener('click', (event) => { if (event.target === paletteEl) close(); });
  paletteEl.addEventListener('keydown', (event) => {
    const matches = filteredActions(input.value);
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); activeIndex = Math.min(activeIndex + 1, matches.length - 1); updateActive(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateActive(); }
    else if (event.key === 'Enter') { event.preventDefault(); runAction(matches[activeIndex]); }
  });
}

export function registerCommands(newActions) {
  actions = newActions;
}

export function initCommandPalette() {
  document.addEventListener('keydown', (event) => {
    const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (!isShortcut) return;
    event.preventDefault();
    if (paletteEl) close(); else open();
  });
}
