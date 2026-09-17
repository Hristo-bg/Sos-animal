import { api, setSession } from '../api.js';
import { renderApp } from './app.js';

export function renderLogin() {
  const app = document.querySelector('#admin-root');
  app.innerHTML = `<main class="login-shell"><section class="login-card"><p class="kicker">SOS ANIMAL / OPERATIONS</p><h1>Data Operations Center</h1><p class="muted">Secure incident coordination for field teams.</p><form id="login-form"><label>Email<input id="email" type="email" value="admin@puten-pazitel.local" required></label><label>Password<input id="password" type="password" value="admin123" required></label><button class="button primary" type="submit">Open command center</button><p id="login-error" class="form-error"></p></form></section></main>`;
  document.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/login', { method: 'POST', body: JSON.stringify({ email: document.querySelector('#email').value.trim(), password: document.querySelector('#password').value }) });
      if (result.user?.role !== 'admin') throw new Error('Administrator access required');
      setSession(result.token, result.user);
      renderApp(result.user);
    } catch (error) {
      document.querySelector('#login-error').textContent = error.message;
    }
  });
}
