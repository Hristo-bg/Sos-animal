/**
 * SOS Animal - API Compatibility Layer
 * Intercepts fetch calls and redirects them to localStorage
 * This allows the existing app.js to work without modification
 */

(function() {
  // Store original fetch
  const originalFetch = window.fetch;

  // Mock fetch function that uses localStorage
  window.fetch = async function(url, options = {}) {
    // If it's not an API call, use original fetch
    if (!url.includes('/api/')) {
      return originalFetch(url, options);
    }

    // Parse the URL to determine the endpoint
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    const method = (options.method || 'GET').toUpperCase();

    console.log(`[API Compat] ${method} ${pathname}`);

    // Handle different endpoints
    if (pathname === '/api/health') {
      return mockResponse({ database: 'connected', db: 'online' });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = JSON.parse(options.body);
      const result = UserService.login(body.email, body.password);
      if (result.success) {
        localStorage.setItem('current_user_email', result.user.email);
        localStorage.setItem('roadguardian_user', JSON.stringify(result.user));
        return mockResponse({ user: result.user, token: result.token });
      } else {
        return mockResponse({ error: result.error }, 401);
      }
    }

    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = JSON.parse(options.body);
      if (body.password !== body.confirmPassword) {
        return mockResponse({ error: 'Passwords do not match' }, 400);
      }
      const result = UserService.register(body.email, body.password, body.name);
      if (result.success) {
        localStorage.setItem('current_user_email', result.user.email);
        localStorage.setItem('roadguardian_user', JSON.stringify(result.user));
        return mockResponse({ user: result.user, token: btoa(`${body.email}:${Date.now()}`) });
      } else {
        return mockResponse({ error: result.error }, 400);
      }
    }

    if (pathname === '/api/incidents') {
      if (method === 'GET') {
        const incidents = IncidentService.getAll();
        return mockResponse(incidents);
      }

      if (method === 'POST') {
        const formData = options.body;
        const incidentData = {
          species: formData.get('species'),
          status: formData.get('status'),
          description: formData.get('description'),
          contact: formData.get('contact'),
          lat: parseFloat(formData.get('lat')),
          lng: parseFloat(formData.get('lng'),
          reporter_email: localStorage.getItem('current_user_email') || 'anonymous@sosanimal.bg',
          photo_url: null // Photos are simulated
        };
        const newIncident = IncidentService.create(incidentData);
        return mockResponse(newIncident);
      }
    }

    if (pathname.match(/\/api\/incidents\/\d+/)) {
      const id = parseInt(pathname.split('/').pop());

      if (method === 'GET') {
        const incident = IncidentService.getById(id);
        if (incident) {
          return mockResponse(incident);
        } else {
          return mockResponse({ error: 'Not found' }, 404);
        }
      }

      if (method === 'PATCH') {
        const body = JSON.parse(options.body);
        const updated = IncidentService.update(id, body);
        if (updated) {
          return mockResponse(updated);
        } else {
          return mockResponse({ error: 'Not found' }, 404);
        }
      }

      if (method === 'DELETE') {
        const deleted = IncidentService.delete(id);
        if (deleted) {
          return mockResponse({ success: true });
        } else {
          return mockResponse({ error: 'Not found' }, 404);
        }
      }
    }

    if (pathname === '/api/incidents/my' && method === 'GET') {
      const email = localStorage.getItem('current_user_email') || 'anonymous@sosanimal.bg';
      const incidents = IncidentService.getByEmail(email);
      return mockResponse(incidents);
    }

    // Default response for unhandled endpoints
    return mockResponse({ error: 'Endpoint not found' }, 404);
  };

  function mockResponse(data, status = 200) {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status: status,
      json: async () => data,
      text: async () => JSON.stringify(data)
    });
  }

  console.log('[API Compat] API compatibility layer loaded');
})();
