/**
 * SOS Animal - Demo Version
 * Simplified landing page with hardcoded authentication
 */

window.onload = () => {
  console.log('SOS Animal Demo - Initializing...');
  
  // Demo state
  let isLoggedIn = false;
  let currentUser = null;
  
  // DOM elements
  const btnLogin = document.getElementById('btnLogin');
  const authOverlay = document.getElementById('authOverlay');
  const authClose = document.getElementById('authClose');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const btnAuthSubmit = document.getElementById('btnAuthSubmit');
  const authError = document.getElementById('authError');
  const btnLangToggle = document.getElementById('btnLangToggle');
  const currentLang = document.getElementById('currentLang');
  
  // i18n system
  const i18n = {
    bg: {
      title: 'SOS Animal',
      home: 'Начало',
      map: 'Карта',
      contacts: 'Контакти',
      login: 'Вход',
      logout: 'Изход',
      demoInfo: 'Инфо за Демото',
      demoInfoTitle: 'Добре дошли в SOS Animal Demo',
      demoInfoIntro: 'Това е интерактивна демонстрация. Всички системи са напълно функционални:',
      demoInfoIncidents: 'Инциденти:',
      demoInfoIncidentsText: 'Картата започва със 7 примерни сигнала.',
      demoInfoAdd: 'Добавяне:',
      demoInfoAddText: 'Кликнете ДВА ПЪТИ върху картата, за да създадете нов сигнал.',
      demoInfoAdmin: 'Админ Панел:',
      demoInfoAdminText: 'Използвайте `admin@sos.animal` / `admin123` за достъп до инструментите.',
      demoInfoRestart: 'Рестарт:',
      demoInfoRestartText: 'Тъй като няма база данни, опресняването на страницата (F5) нулира всички промени.',
      demoInfoGotIt: 'Разбрах!'
    },
    en: {
      title: 'SOS Animal',
      home: 'Home',
      map: 'Map',
      contacts: 'Contact',
      login: 'Login',
      logout: 'Logout',
      demoInfo: 'Demo Info',
      demoInfoTitle: 'Welcome to SOS Animal Demo',
      demoInfoIntro: 'This is an interactive demonstration. All systems are fully functional:',
      demoInfoIncidents: 'Incidents:',
      demoInfoIncidentsText: 'The map starts with 7 sample signals.',
      demoInfoAdd: 'Add:',
      demoInfoAddText: 'Click TWICE on the map to create a new signal.',
      demoInfoAdmin: 'Admin Panel:',
      demoInfoAdminText: 'Use `admin@sos.animal` / `admin123` to access the tools.',
      demoInfoRestart: 'Restart:',
      demoInfoRestartText: 'Since there\'s no database, refreshing the page (F5) resets all changes.',
      demoInfoGotIt: 'Got it!'
    }
  };
  
  let currentLanguage = 'bg';
  
  // Get initial demo data (7 mock incidents)
  function getInitialData() {
    return [
      {
        id: 1,
        species: 'Елен',
        status: 'wounded',
        lat: 42.6977,
        lng: 23.3219,
        description: 'Ранен елен в центъра на София',
        reporter_email: 'admin@sos.animal',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        resolved_at: null,
        admin_notes: '',
        photo_url: null
      },
      {
        id: 2,
        species: 'Лисица',
        status: 'deceased',
        lat: 42.1444,
        lng: 24.7533,
        description: 'Мъртва лисица в Стария град на Пловдив',
        reporter_email: 'admin@sos.animal',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        resolved_at: new Date(Date.now() - 86400000).toISOString(),
        admin_notes: 'Отведено във ветеринарна клиника',
        photo_url: null
      },
      {
        id: 3,
        species: 'Диво прасе',
        status: 'wounded',
        lat: 43.1812,
        lng: 27.9155,
        description: 'Ранено диво прасе близо до Аспарухово, Варна',
        reporter_email: 'admin@sos.animal',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        resolved_at: null,
        admin_notes: '',
        photo_url: null
      },
      {
        id: 4,
        species: 'Костенурка',
        status: 'handled',
        lat: 42.5048,
        lng: 27.4626,
        description: 'Изчистена костенурка в Морската градина, Бургас',
        reporter_email: 'admin@sos.animal',
        created_at: new Date(Date.now() - 345600000).toISOString(),
        resolved_at: new Date(Date.now() - 172800000).toISOString(),
        admin_notes: 'Освободена в безопасна зона',
        photo_url: null
      },
      {
        id: 5,
        species: 'Сърна',
        status: 'deceased',
        lat: 43.0800,
        lng: 25.6500,
        description: 'Мъртва сърна в Проход, Велико Търново',
        reporter_email: 'admin@sos.animal',
        created_at: new Date(Date.now() - 432000000).toISOString(),
        resolved_at: new Date(Date.now() - 259200000).toISOString(),
        admin_notes: '',
        photo_url: null
      },
      {
        id: 6,
        species: 'Язовец',
        status: 'wounded',
        lat: 43.8500,
        lng: 25.9500,
        description: 'Ранен язовец на брега на Дунав, Русе',
        reporter_email: 'admin@sos.animal',
        created_at: new Date(Date.now() - 518400000).toISOString(),
        resolved_at: null,
        admin_notes: '',
        photo_url: null
      },
      {
        id: 7,
        species: 'Куче',
        status: 'handled',
        lat: 42.4200,
        lng: 25.6200,
        description: 'Изчистено куче в Стара Загора',
        reporter_email: 'admin@sos.animal',
        created_at: new Date(Date.now() - 604800000).toISOString(),
        resolved_at: new Date(Date.now() - 345600000).toISOString(),
        admin_notes: 'Отведено в приют',
        photo_url: null
      }
    ];
  }
  
  // Status mapping
  const statusMap = {
    'умряло': 'deceased',
    'ранено': 'wounded',
    'изчистено': 'handled'
  };
  
  const reverseStatusMap = {
    'deceased': 'умряло',
    'wounded': 'ранено',
    'handled': 'изчистено'
  };
  
  // Color mapping for markers
  const statusColors = {
    'wounded': '#FBBF24',
    'deceased': '#EF4444',
    'handled': '#10B981'
  };
  
  // Initialize current incidents with demo data
  window.currentIncidents = getInitialData();
  function showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Language toggle
  btnLangToggle?.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'bg' ? 'en' : 'bg';
    if (currentLang) currentLang.textContent = currentLanguage.toUpperCase();
    updateLanguage();
  });
  
  function updateLanguage() {
    const lang = i18n[currentLanguage];
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (lang[key]) {
        element.textContent = lang[key];
      }
    });
  }
  
  updateLanguage();
  
  // Mobile menu toggle
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  const navLinks = document.querySelector('.nav-links');
  
  if (btnMobileMenu && navLinks) {
    btnMobileMenu.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      // Toggle icon between ☰ and ✕
      btnMobileMenu.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
    });
    
    // Close menu when clicking on a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        btnMobileMenu.textContent = '☰';
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && 
          !navLinks.contains(e.target) && 
          !btnMobileMenu.contains(e.target)) {
        navLinks.classList.remove('active');
        btnMobileMenu.textContent = '☰';
      }
    });
  }
  
  // Auth overlay
  function showAuthOverlay(show) {
    if (!authOverlay) return;
    if (show) {
      authOverlay.classList.remove('hidden');
    } else {
      authOverlay.classList.add('hidden');
    }
  }
  
  // Login button
  btnLogin?.addEventListener('click', () => {
    if (isLoggedIn) {
      // Logout
      isLoggedIn = false;
      currentUser = null;
      localStorage.removeItem('roadguardian_user');
      btnLogin.textContent = 'Вход';
      showToast('Излязохте.');
    } else {
      // Show login form
      showAuthOverlay(true);
    }
  });
  
  // Update navbar based on login state
  function updateNavbar() {
    const userStr = localStorage.getItem('roadguardian_user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (user && user.role === 'admin') {
      // Show admin panel button and logout button
      if (!document.getElementById('btnAdminPanel')) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'btnAdminPanel';
        adminBtn.className = 'btn btnSecondary';
        adminBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Админ Панел';
        adminBtn.style.marginRight = '0.5rem';
        adminBtn.onclick = () => window.location.href = 'dashboard.html';
        btnLogin.parentNode.insertBefore(adminBtn, btnLogin);
      }
      btnLogin.textContent = 'Изход';
    } else {
      // Remove admin panel button
      const adminBtn = document.getElementById('btnAdminPanel');
      if (adminBtn) adminBtn.remove();
      btnLogin.textContent = 'Вход';
    }
  }
  
  // Check login state on load
  updateNavbar();
  
  // Close auth overlay
  authClose?.addEventListener('click', () => {
    showAuthOverlay(false);
  });
  
  // Submit login
  btnAuthSubmit?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = authEmail?.value.trim();
    const password = authPassword?.value;
    
    // Hardcoded demo credentials
    if (email === 'admin@sos.animal' && password === 'admin123') {
      const fakeUser = { email: 'admin@sos.animal', role: 'admin' };
      localStorage.setItem('roadguardian_user', JSON.stringify(fakeUser));
      isLoggedIn = true;
      currentUser = fakeUser;
      showAuthOverlay(false);
      showToast('Успешен вход!');
      updateNavbar();
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } else {
      authError.textContent = 'За демо режим използвайте: admin@sos.animal / admin123';
      showToast('Грешни данни за вход', true);
    }
  });
  
  // Initialize map with demo incidents
  function initMap() {
    if (!window.L || !document.getElementById('mapCanvas')) return;
    
    const map = window.L.map('mapCanvas', { zoomControl: true }).setView([42.7339, 25.4858], 7);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    // Set Bulgaria bounds
    const bounds = window.L.latLngBounds([41.2, 22.0], [44.3, 28.7]);
    map.setMaxBounds(bounds);
    map.setMinZoom(7);
    map.setMaxZoom(18);
    
    // Add demo markers
    const markersLayer = window.L.layerGroup().addTo(map);
    
    window.currentIncidents.forEach(incident => {
      const color = statusColors[incident.status] || '#FBBF24';
      const icon = window.L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      const marker = window.L.marker([incident.lat, incident.lng], { icon: icon });
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong>${incident.species}</strong><br>
          Статус: ${incident.status}<br>
          <small>${new Date(incident.created_at).toLocaleDateString('bg-BG')}</small>
        </div>
      `);
      marker.addTo(markersLayer);
    });
  }
  
  // Initialize map with delay
  setTimeout(() => {
    initMap();
  }, 500);
  
  // GSAP Hero animation
  if (window.gsap) {
    const heroTitle = document.querySelector('.hero-content h1');
    const heroActions = document.querySelector('.hero-actions');
    if (heroTitle && heroActions) {
      gsap.timeline()
        .from(heroTitle, { y: 30, opacity: 0, duration: 1, ease: 'power3.out' })
        .from(heroActions.children, { y: 20, opacity: 0, duration: 0.8, stagger: 0.2 }, '-=0.5');
    }
  }
  
  // Dynamic navbar on scroll
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('solid', window.scrollY > 20);
    });
  }
  
  // Accordion
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      const isOpen = body.classList.contains('show');
      document.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('show'));
      if (!isOpen) body.classList.add('show');
    });
  });
  
  // Scroll to top
  const scrollToTop = document.getElementById('scrollToTop');
  if (scrollToTop) {
    window.addEventListener('scroll', () => {
      scrollToTop.classList.toggle('visible', window.pageYOffset > 300);
    });
    scrollToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  console.log('SOS Animal Demo - Initialized');
};
