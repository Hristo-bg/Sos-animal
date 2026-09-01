/**
 * SOS Animal - LocalStorage Service
 * Simulates backend database operations using localStorage
 */

const DB_INCIDENTS = 'sos_animal_incidents';
const DB_USERS = 'sos_animal_users';

// Sample data for initial load
const SAMPLE_INCIDENTS = [
  {
    id: 1,
    species: 'Лисица',
    status: 'wounded',
    lat: 42.6977,
    lng: 23.3219,
    description: 'Ранена лисица на пътя',
    reporter_email: 'demo@sosanimal.bg',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    resolved_at: null,
    admin_notes: '',
    photo_url: null
  },
  {
    id: 2,
    species: 'Елен',
    status: 'deceased',
    lat: 42.1354,
    lng: 24.7450,
    description: 'Умъртвен елен на магистрала',
    reporter_email: 'demo@sosanimal.bg',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    resolved_at: null,
    admin_notes: '',
    photo_url: null
  },
  {
    id: 3,
    species: 'Заек',
    status: 'wounded',
    lat: 43.2140,
    lng: 27.9147,
    description: 'Ранен заек в градска зона',
    reporter_email: 'demo@sosanimal.bg',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    resolved_at: null,
    admin_notes: '',
    photo_url: null
  },
  {
    id: 4,
    species: 'Котка',
    status: 'handled',
    lat: 42.6980,
    lng: 23.3250,
    description: 'Улична котка, нуждаеща се от помощ',
    reporter_email: 'demo@sosanimal.bg',
    created_at: new Date(Date.now() - 345600000).toISOString(),
    resolved_at: new Date(Date.now() - 86400000).toISOString(),
    admin_notes: 'Отведена във ветеринарна клиника',
    photo_url: null
  },
  {
    id: 5,
    species: 'Сърна',
    status: 'wounded',
    lat: 41.9973,
    lng: 25.3025,
    description: 'Ранена сърна в планински район',
    reporter_email: 'demo@sosanimal.bg',
    created_at: new Date(Date.now() - 432000000).toISOString(),
    resolved_at: null,
    admin_notes: '',
    photo_url: null
  },
  {
    id: 6,
    species: 'Поня',
    status: 'deceased',
    lat: 43.2025,
    lng: 27.9100,
    description: 'Умъртвена поня на пътя',
    reporter_email: 'demo@sosanimal.bg',
    created_at: new Date(Date.now() - 518400000).toISOString(),
    resolved_at: null,
    admin_notes: '',
    photo_url: null
  }
];

const SAMPLE_USERS = [
  {
    email: 'admin@sosanimal.bg',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  {
    email: 'user@sosanimal.bg',
    password: 'user123',
    role: 'user',
    name: 'Regular User'
  }
];

// Initialize database with sample data if empty
function initializeDatabase() {
  if (!localStorage.getItem(DB_INCIDENTS)) {
    localStorage.setItem(DB_INCIDENTS, JSON.stringify(SAMPLE_INCIDENTS));
  }
  if (!localStorage.getItem(DB_USERS)) {
    localStorage.setItem(DB_USERS, JSON.stringify(SAMPLE_USERS));
  }
}

// Incident CRUD Operations
const IncidentService = {
  getAll: () => {
    const incidents = localStorage.getItem(DB_INCIDENTS);
    return incidents ? JSON.parse(incidents) : [];
  },

  getById: (id) => {
    const incidents = IncidentService.getAll();
    return incidents.find(i => i.id === id);
  },

  getByEmail: (email) => {
    const incidents = IncidentService.getAll();
    return incidents.filter(i => i.reporter_email === email);
  },

  create: (incidentData) => {
    const incidents = IncidentService.getAll();
    const newIncident = {
      id: incidents.length > 0 ? Math.max(...incidents.map(i => i.id)) + 1 : 1,
      ...incidentData,
      created_at: new Date().toISOString(),
      resolved_at: null,
      admin_notes: '',
      photo_url: incidentData.photo_url || null
    };
    incidents.push(newIncident);
    localStorage.setItem(DB_INCIDENTS, JSON.stringify(incidents));
    return newIncident;
  },

  update: (id, updates) => {
    const incidents = IncidentService.getAll();
    const index = incidents.findIndex(i => i.id === id);
    if (index !== -1) {
      incidents[index] = { ...incidents[index], ...updates };
      localStorage.setItem(DB_INCIDENTS, JSON.stringify(incidents));
      return incidents[index];
    }
    return null;
  },

  delete: (id) => {
    const incidents = IncidentService.getAll();
    const index = incidents.findIndex(i => i.id === id);
    if (index !== -1) {
      incidents.splice(index, 1);
      localStorage.setItem(DB_INCIDENTS, JSON.stringify(incidents));
      return true;
    }
    return false;
  }
};

// User Authentication Operations
const UserService = {
  getAll: () => {
    const users = localStorage.getItem(DB_USERS);
    return users ? JSON.parse(users) : [];
  },

  register: (email, password, name = '') => {
    const users = UserService.getAll();
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }
    const newUser = {
      email,
      password,
      role: 'user',
      name,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(DB_USERS, JSON.stringify(users));
    return { success: true, user: newUser };
  },

  login: (email, password) => {
    const users = UserService.getAll();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const token = btoa(`${email}:${Date.now()}`);
      return { success: true, user, token };
    }
    return { success: false, error: 'Invalid credentials' };
  },

  getByEmail: (email) => {
    const users = UserService.getAll();
    return users.find(u => u.email === email);
  }
};

// Initialize on load
initializeDatabase();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.IncidentService = IncidentService;
  window.UserService = UserService;
  window.initializeDatabase = initializeDatabase;
}
