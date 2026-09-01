window.onload = () => {
  // Cache DOM elements after load to avoid init errors
  console.log('RoadGuardian V6 - Initializing...');
  const els = {
    // Authentication elements
    authOverlay: document.getElementById('authOverlay'),
    authClose: document.getElementById('authClose'),
    reportPanel: document.getElementById('reportPanel'),
    reportClose: document.getElementById('reportClose'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    authPasswordConfirm: document.getElementById('authPasswordConfirm'),
    authError: document.getElementById('authError'),
    btnAuthSubmit: document.getElementById('btnAuthSubmit'),
    btnToggleAuthMode: document.getElementById('btnToggleAuthMode'),
    rememberMe: document.getElementById('rememberMe'),
    
    // Map elements
    mapCanvas: document.getElementById('mapCanvas'),
    mapInstruction: document.getElementById('mapInstruction'),
    
    // Report panel elements
    reportPanel: document.getElementById('reportPanel'),
    reportSpecies: document.getElementById('reportSpecies'),
    reportStatus: document.getElementById('reportStatus'),
    reportPhoto: document.getElementById('reportPhoto'),
    reportLat: document.getElementById('reportLat'),
    reportLng: document.getElementById('reportLng'),
    btnSubmitReport: document.getElementById('btnSubmitReport'),
    reportError: document.getElementById('reportError'),
    btnCloseReportPanel: document.getElementById('btnCloseReportPanel'),
    
    // Admin panel elements
    adminPanel: document.getElementById('adminPanel'),
    btnCloseAdmin: document.getElementById('btnCloseAdmin'),
    incidentDetails: document.getElementById('incidentDetails'),
    statusSelect: document.getElementById('statusSelect'),
    adminNotes: document.getElementById('adminNotes'),
    btnUpdateStatus: document.getElementById('btnUpdateStatus'),
    btnSaveNotes: document.getElementById('btnSaveNotes'),
    btnDeleteIncident: document.getElementById('btnDeleteIncident'),
    
    // Navigation elements
    btnLogin: document.getElementById('btnLogin'),
    btnMobileMenu: document.getElementById('btnMobileMenu'),
    btnTakeLook: document.getElementById('btnTakeLook'),
    btnJoinMission: document.getElementById('btnJoinMission'),
    btnAddSignal: document.getElementById('btnAddSignal'),
    
    // Other elements
    banner: document.getElementById('banner'),
    navbar: document.querySelector('.navbar'),
    heroContent: document.querySelector('.hero-content'),
    heroTitle: document.querySelector('.hero-content h1'),
    heroActions: document.querySelector('.hero-actions'),
    
    // Language elements
    btnLangToggle: document.getElementById('btnLangToggle'),
    currentLang: document.getElementById('currentLang'),
  };

  // i18n system
  const i18n = {
    bg: {
      title: 'SOS Animal',
      tagline: 'Чистим пътищата, пазим дивите животни.',
            takeLook: 'Вземи поглед',
      joinMission: 'Присъедини се',
      home: 'Начало',
      about: 'За нас',
      map: 'Карта',
      contacts: 'Контакти',
      login: 'Вход',
      logout: 'Изход',
      admin: 'Админ',
      reportTitle: 'Подаване на сигнал',
      reportInstructions: 'Натисни върху картата, за да маркираш място',
      instructionBg: 'Кликни два пъти за маркер',
      instructionEn: 'Double click to place a marker',
      emergencyCall: 'Спешно повикване',
      emergencyDesc: 'Бърз достъп до спешни услуги за спасяване на диви животни',
      mapTrack: 'Проследяване на карта',
      mapDesc: 'Проследяване на инциденти с диви животни в реално време',
      professionalCleanup: 'Професионално почистване',
      cleanupDesc: 'Координиран отговор за безопасно премахване на животни'
    },
    en: {
      title: 'SOS Animal',
      tagline: 'Cleaning roads, protecting wildlife.',
      takeLook: 'Take Look',
      joinMission: 'Join Mission',
      home: 'Home',
      about: 'About',
      map: 'Map',
      contacts: 'Contact',
      login: 'Login',
      logout: 'Logout',
      admin: 'Admin',
      reportTitle: 'Submit Report',
      reportInstructions: 'Click on the map to mark a location',
      instructionBg: 'Кликни два пъти за маркер',
      instructionEn: 'Double click to place a marker',
      emergencyCall: 'Emergency call',
      emergencyDesc: 'Quick access to emergency services for wildlife rescue',
      mapTrack: 'Map track',
      mapDesc: 'Real-time tracking of wildlife incidents across Bulgaria',
      professionalCleanup: 'Professional cleanup',
      cleanupDesc: 'Coordinated response for safe animal removal'
    }
  };

  let currentLanguage = 'bg'; // 'bg' or 'en'

  // Update all text elements with current language
  function updateLanguage() {
    const lang = i18n[currentLanguage];
    
    // Update navigation
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (lang[key]) {
        if (element.querySelector('[data-i18n-text]')) {
          element.querySelector('[data-i18n-text]').textContent = lang[key];
        } else {
          element.textContent = lang[key];
        }
      }
    });
    
    // Update elements with direct data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (lang[key] && !element.querySelector('[data-i18n-text]')) {
        element.textContent = lang[key];
      }
    });
    
    // Update language toggle button
    if (els.currentLang) {
      els.currentLang.textContent = currentLanguage.toUpperCase();
    }
    
    // Update logo alt text
    updateLogoAltText();
  }

  // Validate critical elements
  if (!els.mapCanvas) {
    console.error('Critical error: mapCanvas element not found!');
  }
  if (!els.authOverlay) {
    console.error('Warning: authOverlay element not found');
  }
  if (!els.reportPanel) {
    console.error('Warning: reportPanel element not found');
  }

  const API_BASE = 'http://localhost:3333/api';
  let authToken = localStorage.getItem('roadguardian_token');
  let authMode = 'signin'; // 'signin' or 'register'
  let currentUser = null;

  // Status mapping for UI to backend conversion
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

  // Toast system
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

  // DB warning banner (persistent)
  let dbBanner;
  function setDbOfflineUI(isOffline) {
    if (isOffline) {
      if (!dbBanner) {
        dbBanner = document.createElement('div');
        dbBanner.style.position = 'sticky';
        dbBanner.style.top = '0';
        dbBanner.style.zIndex = '50';
        dbBanner.style.background = '#ef4444';
        dbBanner.style.color = '#fff';
        dbBanner.style.fontWeight = '800';
        dbBanner.style.padding = '10px 12px';
        dbBanner.style.textAlign = 'center';
        dbBanner.textContent = 'ВНИМАНИЕ: Проблем с базата данни! Информацията на картата може да не е актуална.';
        const mapCanvas = document.getElementById('mapCanvas');
        if (mapCanvas?.parentElement) {
          mapCanvas.parentElement.insertBefore(dbBanner, mapCanvas);
        } else {
          document.body.insertBefore(dbBanner, document.body.firstChild);
        }
      }
      if (els.btnAddSignal) els.btnAddSignal.style.display = 'none';
    } else {
      if (dbBanner) {
        dbBanner.remove();
        dbBanner = null;
      }
      updateAuthUI();
    }
  }

  // Loader
  function showLoader(show) {
    let loader = document.querySelector('.loader');
    if (show && !loader) {
      loader = document.createElement('div');
      loader.className = 'loader';
      loader.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.05L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `;
      document.body.appendChild(loader);
    } else if (!show && loader) {
      loader.remove();
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // Auth UI
  function showAuthOverlay(show) {
    if (!els.authOverlay) return;
    if (show) {
      els.authOverlay.classList.remove('hidden');
    } else {
      els.authOverlay.classList.add('hidden');
    }
  }

  function showReportPanel(show) {
    if (!els.reportPanel) return;
    if (show) {
      els.reportPanel.classList.remove('hidden');
    } else {
      els.reportPanel.classList.add('hidden');
      // Remove temporary marker if closing
      if (window.tempReportMarker) {
        window.tempReportMarker.remove();
        window.tempReportMarker = null;
      }
    }

    updateMapInstruction();
  }

  function setAuthMode(mode) {
    authMode = mode;
    els.btnAuthSubmit.textContent = mode === 'signin' ? 'Вход' : 'Регистрация';
    els.btnToggleAuthMode.textContent = mode === 'signin' ? 'Нужен акаунт? Регистрация' : 'Имате акаунт? Вход';
    els.authError.textContent = '';
    const extras = document.getElementById('registerExtras');
    if (extras) extras.style.display = mode === 'register' ? 'block' : 'none';
    
    const rememberContainer = document.getElementById('rememberMeContainer');
    if (rememberContainer) rememberContainer.style.display = mode === 'register' ? 'none' : 'flex';
  }

  // API wrappers
  async function apiCall(method, endpoint, body = null, requireAuth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (requireAuth && authToken) headers['Authorization'] = `Bearer ${authToken}`;
    let res;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new Error('FAILED_TO_FETCH');
    }

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const apiError = (data && (data.code || data.error)) ? String(data.code || data.error) : 'REQUEST_FAILED';
      throw new Error(apiError);
    }
    return data;
  }

  // Auth handlers
  els.btnToggleAuthMode?.addEventListener('click', () => setAuthMode(authMode === 'signin' ? 'register' : 'signin'));
  els.authClose?.addEventListener('click', () => {
    showAuthOverlay(false);
    updateMapInstruction();
  });
  els.reportClose?.addEventListener('click', () => {
    showReportPanel(false);
  });
  els.btnLogin?.addEventListener('click', () => showAuthOverlay(true));

  els.btnAuthSubmit?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = String(els.authEmail?.value ?? '').trim();
    const password = String(els.authPassword?.value ?? '');
    const rememberMe = document.getElementById('rememberMe');
    
    if (!email || !password) {
      els.authError.textContent = 'Въведете имейл и парола.';
      return;
    }
    if (authMode === 'register') {
      const confirmPassword = document.getElementById('authPasswordConfirm')?.value;
      const consent = document.getElementById('gdprConsent');
      
      if (!confirmPassword || password !== confirmPassword) {
        els.authError.textContent = 'Паролите не съвпадат.';
        return;
      }
      
      if (!consent || !consent.checked) {
        els.authError.textContent = 'Трябва да се съгласите с условията за GDPR.';
        return;
      }
    }
    const originalText = els.btnAuthSubmit.textContent;
    els.btnAuthSubmit.textContent = 'Влизане...';
    els.btnAuthSubmit.disabled = true;
    try {
      const data = authMode === 'signin'
        ? await apiCall('POST', '/login', { email, password })
        : await apiCall('POST', '/register', { email, password, role: 'reporter' });
      authToken = data.token;
      localStorage.setItem('roadguardian_token', authToken);
      localStorage.setItem('roadguardian_user', JSON.stringify(data.user));
      
      // Remember Me functionality
      if (authMode === 'signin' && rememberMe && rememberMe.checked) {
        localStorage.setItem('roadguardian_remember', 'true');
        localStorage.setItem('roadguardian_email', email);
      } else {
        localStorage.removeItem('roadguardian_remember');
        localStorage.removeItem('roadguardian_email');
      }
      
      els.btnLogin.textContent = 'Изход';
      showAuthOverlay(false);
      showToast(authMode === 'signin' ? 'Успешен вход!' : 'Регистрацията е успешна!');
      updateMapInstruction();
      // Update UI for logged-in user
      // Redirect to dashboard for reporters
      if (data.user.role === 'reporter' || data.user.role === 'admin') {
        window.location.href = 'dashboard.html';
      } else {
        // Guests stay on landing page
        if (data.user.role === 'admin' || data.user.role === 'org') {
          showToast('Админ инструменти активирани.');
        }
      }
    } catch (e) {
      if (e.message === 'FAILED_TO_FETCH') {
        els.authError.textContent = 'Грешка: Сървърът не е включен. Стартирайте starter/run_all.bat';
      } else if (e.message === 'DB_OFFLINE' || e.message === 'DB_UNAVAILABLE') {
        els.authError.textContent = 'Базата данни не е активна. Пуснете MySQL и изпълнете backend/setup.sql';
        setDbOfflineUI(true);
      } else {
        els.authError.textContent = e.message;
      }
    } finally {
      els.btnAuthSubmit.textContent = originalText;
      els.btnAuthSubmit.disabled = false;
    }
  });

  // Language toggle handler
  els.btnLangToggle?.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'bg' ? 'en' : 'bg';
    updateLanguage();
    localStorage.setItem('sos_animal_language', currentLanguage);
  });
  
  // Load saved language preference
  const savedLanguage = localStorage.getItem('sos_animal_language');
  if (savedLanguage) {
    currentLanguage = savedLanguage;
  }
  
  // Update language on load
  updateLanguage();
  
  // Update logo alt text based on language
  function updateLogoAltText() {
    const altText = currentLanguage === 'bg' ? 'SOS Animal Лого' : 'SOS Animal Logo';
    document.querySelectorAll('.brand-logo, .hero-logo, .auth-logo img, .footer-logo').forEach(logo => {
      logo.alt = altText;
    });
  }
  
  // Update logo alt text when language changes
  updateLogoAltText();

  // Sign out
  els.btnLogin?.addEventListener('click', () => {
    if (authToken && els.btnLogin.textContent === 'Изход') {
      authToken = null;
      localStorage.removeItem('roadguardian_token');
      localStorage.removeItem('roadguardian_user');
      els.btnLogin.textContent = 'Вход';
      showToast('Излязохте.');
      updateMapInstruction();
      updateAuthUI();
    }
  });

  function updateAuthUI() {
    if (authToken && currentUser) {
      els.btnLogin.textContent = 'Изход';
      els.btnAddSignal.style.display = 'block';
      
      // Show admin panel button for admin users
      if (currentUser.role === 'admin') {
        if (!document.getElementById('btnAdminPanel')) {
          const adminBtn = document.createElement('button');
          adminBtn.id = 'btnAdminPanel';
          adminBtn.className = 'btn btnPrimary';
          adminBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Админ';
          adminBtn.style.marginLeft = '0.5rem';
          adminBtn.onclick = () => showAdminPanel();
          els.btnLogin.parentNode.insertBefore(adminBtn, els.btnLogin);
        }
      }
    } else {
      els.btnLogin.textContent = 'Вход';
      els.btnAddSignal.style.display = 'none';
      
      // Remove admin panel button
      const adminBtn = document.getElementById('btnAdminPanel');
      if (adminBtn) adminBtn.remove();
    }
  }

  updateAuthUI();

  // GSAP Hero animation
  if (window.gsap && els.heroTitle && els.heroActions) {
    gsap.timeline()
      .from(els.heroTitle, { y: 30, opacity: 0, duration: 1, ease: 'power3.out' })
      .from(els.heroActions.children, { y: 20, opacity: 0, duration: 0.8, stagger: 0.2 }, '-=0.5');
  }

  // Dynamic navbar on scroll
  if (els.navbar) {
    window.addEventListener('scroll', () => {
      els.navbar.classList.toggle('solid', window.scrollY > 20);
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

  // Report panel
  els.btnCloseReportPanel?.addEventListener('click', () => {
    els.reportPanel?.classList.add('hidden');
  });

  els.btnSubmitReport?.addEventListener('click', async () => {
    const species = els.reportSpecies?.value.trim();
    const status = statusMap[els.reportStatus?.value] || els.reportStatus?.value;
    const file = els.reportPhoto?.files?.[0];
    if (!species) {
      els.reportError.textContent = 'Моля, въведете вид животно.';
      return;
    }
    try {
      showLoader(true);
      const formData = new FormData();
      formData.append('lat', pendingReportLat);
      formData.append('lng', pendingReportLng);
      formData.append('species', species);
      formData.append('status', status);
      if (file) formData.append('photo', file);
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }
      if (!res.ok) {
        const code = data?.code || data?.error;
        if (code === 'DB_OFFLINE' || code === 'DB_UNAVAILABLE') {
          setDbOfflineUI(true);
          throw new Error('Базата данни не е активна. Опитайте отново след стартиране на MySQL.');
        }
        throw new Error(data?.message || data?.error || 'Неуспешно изпращане.');
      }
      showToast('Сигналът е изпратен!');
      // Clear form inputs immediately
      if (els.reportSpecies) els.reportSpecies.value = '';
      if (els.reportStatus) els.reportStatus.value = 'ранено';
      if (els.reportPhoto) els.reportPhoto.value = '';
      if (els.reportError) els.reportError.textContent = '';
      els.reportPanel?.classList.add('hidden');
      fetchIncidents();
    } catch (e) {
      els.reportError.textContent = e.message;
    } finally {
      showLoader(false);
    }
  });

  // Landing page actions
  els.btnTakeLook?.addEventListener('click', () => {
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  });

  els.btnJoinMission?.addEventListener('click', () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Scroll indicator action
  document.querySelector('.scrollIndicator')?.addEventListener('click', () => {
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Mobile menu toggle (placeholder)
  els.btnMobileMenu?.addEventListener('click', () => {
    showToast('Mobile menu coming soon.');
  });

  // Add Signal button
  els.btnAddSignal?.addEventListener('click', () => {
    if (!authToken) {
      showToast('Моля, влезте в профила си, за да добавите сигнал.', true);
      showAuthOverlay(true);
    } else {
      showToast('Дълго натиснете върху картата, за да добавите сигнал.');
    }
  });

  // Initialize Leaflet map immediately
  let map, markersLayer, markersById = new Map();
  let pendingReportLat, pendingReportLng;
  function initMap() {
    console.log('initMap called, window.L:', !!window.L, 'els.mapCanvas:', !!els.mapCanvas, 'map:', !!map);
    if (!window.L || !els.mapCanvas || map) {
      console.log('Map initialization blocked - missing dependencies or already initialized');
      return;
    }
    
    console.log('Creating map instance...');
    map = window.L.map('mapCanvas', { zoomControl: true }).setView([42.7339, 25.4858], 7);
    
    console.log('Adding tile layer...');
    const tiles = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: ' OpenStreetMap contributors  CARTO',
      maxZoom: 19
    }).addTo(map);
    
    // Set Bulgaria bounds
    const bounds = window.L.latLngBounds([41.2, 22.0], [44.3, 28.7]);
    map.setMaxBounds(bounds);
    map.setMinZoom(7);
    map.setMaxZoom(18);
    map.options.worldCopyJump = false;
    map.on('drag', () => {
      if (!bounds.contains(map.getBounds().getSouthWest())) {
        map.panInsideBounds(bounds, { animate: false });
      }
    });
    
    // Add error handling for tile loading
    tiles.on('tileerror', (e) => {
      console.error('Tile loading error:', e);
    });
    
    tiles.on('tileload', (e) => {
      console.log('Tile loaded successfully');
    });
    
    console.log('Adding markers layer...');
    markersLayer = window.L.layerGroup().addTo(map);
    
    console.log('Map initialized successfully');
    
    // Language toggle setup
    setupLanguageToggle();

    // Scroll to top functionality
    const scrollToTop = document.getElementById('scrollToTop');

    if (scrollToTop) {
      // Show/hide scroll to top button
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          scrollToTop.classList.add('visible');
        } else {
          scrollToTop.classList.remove('visible');
        }
      });

      // Scroll to top functionality
      scrollToTop.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }

    // Double-click to place marker (reporters only)
    map.on('dblclick', (e) => {
      if (!authToken) {
        showToast('Влезте, за да докладвате инциденти', true);
        return;
      }
      
      pendingReportLat = e.latlng.lat;
      pendingReportLng = e.latlng.lng;

      // Remove any existing temporary marker
      if (window.tempReportMarker) {
        window.tempReportMarker.remove();
      }

      // Place pulsing temporary marker
      const tempIcon = window.L.divIcon({
        html: '<div class="pulse-marker-container"><i class="fas fa-map-marker-alt" style="color:#FFFFFF;font-size:28px;"></i></div>',
        iconSize: [28, 28],
        className: 'temp-report-marker',
      });
      
      window.tempReportMarker = window.L.marker([pendingReportLat, pendingReportLng], { icon: tempIcon }).addTo(map);
      
      // Auto-open report panel
      showReportPanel(true);

      // Auto-fill coordinates (hidden fields)
      const latInput = document.getElementById('reportLat');
      const lngInput = document.getElementById('reportLng');
      if (latInput) latInput.value = pendingReportLat;
      if (lngInput) lngInput.value = pendingReportLng;
    });

    map.on('contextmenu', (e) => {
      e.originalEvent.preventDefault();
    });

    // fetchIncidents() called in timeout above
  }

  // Show/hide map instruction based on auth status
  function updateMapInstruction() {
    if (els.mapInstruction) {
      const isInReportMode = !!authToken && !!currentUser && (
        (!!els.reportPanel && !els.reportPanel.classList.contains('hidden')) ||
        !!window.tempReportMarker
      );

      els.mapInstruction.classList.toggle('visible', isInReportMode);
    }
  }

  // Initialize map with delay to ensure DOM is ready
  setTimeout(() => {
    console.log('Initializing map...'); 
    initMap();
    fetchIncidents();
    updateMapInstruction();
    
    // Refresh map size after initialization
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        console.log('Map size refreshed');
      }
    }, 100);
  }, 500);

  // Fetch and render incidents (public)
  async function fetchIncidents() {
    try {
      showLoader(true);
      const incidents = await apiCall('GET', '/incidents');
      setDbOfflineUI(false);
      renderMarkers(incidents);
    } catch (e) {
      console.error('Fetch incidents error:', e);
      if (e.message === 'FAILED_TO_FETCH') {
        showToast('Грешка: Сървърът не е включен! Моля стартирайте starter/run_all.bat', true);
        return;
      }
      if (e.message === 'DB_OFFLINE' || e.message === 'DB_UNAVAILABLE') {
        setDbOfflineUI(true);
        showToast('Базата данни не е активна. Пуснете MySQL (XAMPP/WAMP) и изпълнете backend/setup.sql в phpMyAdmin.', true);
        return;
      }
      showToast(`Грешка при зареждане: ${e.message}`, true);
    } finally {
      showLoader(false);
    }
  }

  function renderMarkers(items) {
    const seen = new Set();
    for (const i of items) {
      seen.add(i.id);
      const existing = markersById.get(i.id);
      if (existing) {
        existing.setLatLng([i.lat, i.lng]);
        // Update marker color if status changed
        const newIcon = createMarkerIcon(i.status);
        existing.setIcon(newIcon);
      } else {
        const marker = window.L.marker([i.lat, i.lng], { icon: createMarkerIcon(i.status) });
        marker.__incident = i;
        
        // Create popup content
        const popupContent = createPopupContent(i);
        marker.bindPopup(popupContent);
        
        // Add click event for admin panel
        marker.on('click', () => {
          if (authToken && currentUser?.role === 'admin') {
            showAdminPanel();
            loadIncidentDetails(i.id);
          }
        });
        
        markersById.set(i.id, marker);
        marker.addTo(markersLayer);
      }
    }
    // Remove stale markers
    for (const [id, marker] of markersById.entries()) {
      if (!seen.has(id)) {
        marker.removeFrom(markersLayer);
        markersById.delete(id);
      }
    }
    // Fit map to markers if first load
    if (markersById.size > 0 && !map._loaded) { 
      const bounds = window.L.latLngBounds(Array.from(markersById.values()).map(m => m.getLatLng()));
      map.fitBounds(bounds.pad(0.12));
      map._loaded = true;
    }
  }

  // Admin action: mark incident as handled
  window.markHandled = async (id) => {
    try {
      await apiCall('PATCH', `/incidents/${id}`, { status: 'handled' }, true);
      showToast('Инцидентът е маркиран като обработен');
      fetchIncidents();
    } catch (e) {
      showToast(e.message, true);
    }
  };

  // Speed safety overlay
  let speedOverlay;
  function showSpeedOverlay(show) {
    if (show && !speedOverlay) {
      speedOverlay = document.createElement('div');
      speedOverlay.className = 'speedOverlay';
      speedOverlay.innerHTML = `
        <div class="speedContent">
          <i class="fas fa-exclamation-triangle"></i>
          <div>НЕ ДОКЛАДВАЙТЕ ДОГАДВАЙКИ.<br/>СПРЕТЕ НА СИГУРНО МЯСТО ПЪРВО.</div>
        </div>
      `;
      document.body.appendChild(speedOverlay);
    } else if (!show && speedOverlay) {
      speedOverlay.remove();
      speedOverlay = null;
    }
  }
  
  // Geolocation speed monitor
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => {
        const speed = pos.coords.speed;
        if (speed && speed > 7) {
          showSpeedOverlay(true);
        } else {
          showSpeedOverlay(false);
        }
      },
      () => showSpeedOverlay(false),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  }

  // Initial auth state
  if (authToken) {
    // Verify token on load
    (async () => {
      try {
        const data = await apiCall('POST', '/verify', null, true);
        els.btnLogin.textContent = 'Изход';
        window.currentUser = data.user;
        localStorage.setItem('roadguardian_user', JSON.stringify(data.user));
        
        // Redirect to dashboard if user is authenticated
        if (data.user.role === 'admin') {
          window.location.href = 'dashboard.html';
        } else {
          updateAuthUI();
        }
      } catch (e) {
        localStorage.removeItem('roadguardian_token');
        localStorage.removeItem('roadguardian_user');
        authToken = null;
        showToast('Сесията е изтекла. Влезте отново.', true);
        updateAuthUI();
      }
    })();
  } else {
    updateAuthUI();
  }

  // Remember Me - auto-fill email if saved
  const savedEmail = localStorage.getItem('roadguardian_email');
  const rememberMe = localStorage.getItem('roadguardian_remember');
  if (savedEmail && rememberMe === 'true' && els.authEmail) {
    els.authEmail.value = savedEmail;
    const rememberCheckbox = document.getElementById('rememberMe');
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  // Scroll to top functionality
  const scrollToTopBtn = document.getElementById('scrollToTop');
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Admin Panel functionality
  let selectedIncidentId = null;
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY; 
  let xOffset = 0;
  let yOffset = 0;

  // Make admin functions global for popup access
  window.showAdminPanel = function() {
    if (!els.adminPanel) return;
    els.adminPanel.classList.add('visible');
    
    // Center the panel if it's the first time opening
    if (!els.adminPanel.dataset.initialized) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = 380; // Fixed width
      const panelHeight = 400; // Minimum height
      
      // Center in viewport with bounds checking
      const centerX = Math.max(20, Math.min((viewportWidth - panelWidth) / 2, viewportWidth - panelWidth - 20));
      const centerY = Math.max(20, Math.min((viewportHeight - panelHeight) / 2, viewportHeight - panelHeight - 20));
      
      els.adminPanel.style.left = `${centerX}px`;
      els.adminPanel.style.top = `${centerY}px`;
      els.adminPanel.style.right = 'auto';
      els.adminPanel.dataset.initialized = 'true';
    }
    
    // Load incidents when panel opens
    if (currentUser?.role === 'admin') {
      loadIncidentsList();
    }
  };

  // Load incidents list
  function loadIncidentsList(filter = '') {
    const container = document.getElementById('incidentsContainer');
    container.innerHTML = '<div class="loadingMessage">Зареждане на инциденти...</div>';
    
    apiCall('GET', `/incidents${filter ? `?status=${filter}` : ''}`)
      .then(incidents => {
        renderIncidentsList(incidents);
      })
      .catch(err => {
        console.error('Error loading incidents:', err);
        container.innerHTML = '<div class="loadingMessage">Грешка при зареждане на инциденти</div>';
        showToast('Грешка при зареждане на инциденти', true);
      });
  }

  // Render incidents list
  function renderIncidentsList(incidents) {
    const container = document.getElementById('incidentsContainer');
    
    if (incidents.length === 0) {
      container.innerHTML = '<div class="loadingMessage">Няма намерени инциденти</div>';
      return;
    }
    
    // Status mapping - Bulgarian to English for API, English to Bulgarian for UI
    const statusMap = {
      wounded: 'Ранено',
      deceased: 'Умряло',
      investigating: 'Разследва се',
      treated: 'Лекувано',
      released: 'Освободено',
      verified: 'Потвърдено',
      archived: 'Архивирано'
    };

    // Reverse mapping for API calls (Bulgarian to English)
    const statusToApi = {
      'Ранено': 'wounded',
      'Умряло': 'deceased',
      'Разследва се': 'investigating',
      'Лекувано': 'treated',
      'Освободено': 'released',
      'Потвърдено': 'verified',
      'Архивирано': 'archived'
    };

    // Helper function to escape HTML
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    const statusColors = {
      wounded: '#ffbc00',      // Светещо кехлибарено
      deceased: '#ff4d4d',      // Ярко неоново червено
      investigating: '#ff9500', // Оранжево за разследване
      treated: '#00d4ff',      // Светещо синьо
      released: '#00ff88',     // Неоново изумрудено
      verified: '#9d4edd',     // Лилаво за потвърдено
      archived: '#6b7280'      // Сиво за архивирани
    };
    
    container.innerHTML = incidents.map(incident => {
        // Show current user's name if they reported this incident
        const displayName = (incident.reporter_email === currentUser?.email) ? 
          `${currentUser.email} (Вие)` : 
          (incident.reporter_email || 'Анонимен');
        
        return `
      <div class="incidentItem" onclick="showIncidentDetails(${incident.id})">
        <div class="incidentItemHeader">
          <div class="incidentItemTitle">#${incident.id} - ${incident.species || 'Непознато'}</div>
          <div class="incidentItemStatus" style="background: ${statusColors[incident.status]}; color: white;">
            ${statusMap[incident.status] || incident.status}
          </div>
        </div>
        <div class="incidentItemMeta">
          <span><i class="fas fa-calendar"></i> ${new Date(incident.created_at).toLocaleDateString('bg-BG')}</span>
          <span><i class="fas fa-user"></i> ${displayName}</span>
          ${incident.resolved_at ? `<span><i class="fas fa-check"></i> ${new Date(incident.resolved_at).toLocaleDateString('bg-BG')}</span>` : ''}
        </div>
      </div>
    `;
    }).join('');
  }

  // Show incident details
  function showIncidentDetails(incidentId) {
    selectedIncidentId = incidentId;
    
    // Hide list view, show details view
    document.getElementById('incidentsList').style.display = 'none';
    document.getElementById('incidentDetailsView').style.display = 'block';
    
    loadIncidentDetails(incidentId);
  }

  // Back to list
  function backToList() {
    // Hide details view, show list view
    document.getElementById('incidentDetailsView').style.display = 'none';
    document.getElementById('incidentsList').style.display = 'block';
    selectedIncidentId = null;
  }

  window.hideAdminPanel = function() {
    if (!els.adminPanel) return;
    els.adminPanel.classList.remove('visible');
    selectedIncidentId = null;
  };

  window.showIncidentDetails = showIncidentDetails;
  window.backToList = backToList;
  window.loadIncidentsList = loadIncidentsList;

  window.loadIncidentDetails = function(incidentId) {
    selectedIncidentId = incidentId;
    
    // Show loading state
    els.incidentDetails.innerHTML = `
      <h4>Инцидент детайли</h4>
      <div class="detailLoading">Зареждане...</div>
    `;

    // Fetch incident details
    apiCall('GET', `/incidents/${incidentId}`, null, true)
      .then(incident => {
        displayIncidentDetails(incident);
      })
      .catch(err => {
        console.error('Error loading incident details:', err);
        els.incidentDetails.innerHTML = `
          <h4>Инцидент детайли</h4>
          <div class="detailError">Грешка при зареждане на детайлите</div>
        `;
      });
  }

  function displayIncidentDetails(incident) {
    const statusMap = {
      wounded: 'Ранено',
      deceased: 'Умряло',
      investigating: 'Разследва се',
      treated: 'Лекувано',
      released: 'Освободено',
      verified: 'Потвърдено',
      archived: 'Архивирано'
    };

    const reporterDisplay = (incident.reporter_email === currentUser?.email) ? 
      `${currentUser.email} (Вие)` : 
      (incident.reporter_email || 'Анонимен');

    els.incidentDetails.innerHTML = `
      <h4>Инцидент детайли #${incident.id}</h4>
      <div class="detailItem">
        <strong>Вид:</strong> ${incident.species || 'Непознато'}
      </div>
      <div class="detailItem">
        <strong>Статус:</strong> <span class="status-${incident.status} status-clickable">${statusMap[incident.status] || incident.status}</span>
      </div>
      <div class="detailItem">
        <strong>Координати:</strong> ${incident.lat.toFixed(6)}, ${incident.lng.toFixed(6)}
      </div>
      <div class="detailItem">
        <strong>Докладвано от:</strong> ${reporterDisplay}
      </div>
      ${incident.resolver_email ? `
        <div class="detailItem">
          <strong>Обработено от:</strong> ${incident.resolver_email}
        </div>
      ` : ''}
      <div class="detailItem">
        <strong>Създадено:</strong> ${new Date(incident.created_at).toLocaleString('bg-BG')}
      </div>
      ${incident.resolved_at ? `
        <div class="detailItem">
          <strong>Разрешено:</strong> ${new Date(incident.resolved_at).toLocaleString('bg-BG', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </div>
      ` : ''}
      ${incident.admin_notes ? `
        <div class="detailItem">
          <strong>Админ бележки:</strong><br>
          <div class="adminNotesDisplay">${incident.admin_notes}</div>
        </div>
      ` : ''}
      ${incident.photo_url ? `
        <div class="detailItem">
          <strong>Снимка:</strong><br>
          <img src="${incident.photo_url}" alt="Incident photo" style="max-width: 100%; border-radius: 8px; margin-top: 0.5rem;">
        </div>
      ` : ''}
    `;

    // Set current status and notes
    els.statusSelect.value = incident.status;
    els.adminNotes.value = incident.admin_notes || '';
  }

  // Admin panel event listeners
  els.btnCloseAdmin?.addEventListener('click', hideAdminPanel);
  
  // New event listeners for admin panel
  document.getElementById('btnRefreshList')?.addEventListener('click', () => {
    const filter = document.getElementById('filterStatus').value;
    loadIncidentsList(filter);
  });
  
  document.getElementById('filterStatus')?.addEventListener('change', (e) => {
    loadIncidentsList(e.target.value);
  });
  
  document.getElementById('btnBackToList')?.addEventListener('click', backToList);

  // Window controls
  const minimizeBtn = els.adminPanel?.querySelector('.windowControl.minimize');
  const maximizeBtn = els.adminPanel?.querySelector('.windowControl.maximize');
  
  minimizeBtn?.addEventListener('click', () => {
    els.adminPanel.style.height = '60px';
    els.adminPanel.style.overflow = 'hidden';
    els.adminPanelContent.style.display = 'none';
    minimizeBtn.style.background = '#10b981';
    maximizeBtn.style.background = '#fbbf24';
  });
  
  maximizeBtn?.addEventListener('click', () => {
    els.adminPanel.style.height = '';
    els.adminPanel.style.maxHeight = '';
    els.adminPanel.style.overflow = '';
    els.adminPanelContent.style.display = 'block';
    maximizeBtn.style.background = '#fbbf24';
    minimizeBtn.style.background = '#10b981';
  });

  // Quick status change
  window.quickStatusChange = function(incidentId, newStatus) {
    if (!authToken || !currentUser?.role === 'admin') return;
    
    const originalText = els.btnUpdateStatus?.innerHTML;
    
    if (els.btnUpdateStatus) {
      els.btnUpdateStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновяване...';
      els.btnUpdateStatus.disabled = true;
    }
    
    apiCall('PATCH', `/incidents/${incidentId}`, { status: statusToApi[newStatus] || newStatus }, true)
      .then(() => {
        showToast('Статусът е обновен успешно');
        loadIncidentDetails(incidentId);
        fetchIncidents();
      })
      .catch(err => {
        console.error('Error updating status:', err);
        showToast('Грешка при обновяване на статуса', true);
      })
      .finally(() => {
        if (els.btnUpdateStatus) {
          els.btnUpdateStatus.innerHTML = originalText;
          els.btnUpdateStatus.disabled = false;
        }
      });
  };

  // Drag functionality
  if (els.adminPanel && els.adminPanelHeader) {
    els.adminPanelHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Touch events for mobile
    els.adminPanelHeader.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);
  }

  function dragStart(e) {
    if (!els.adminPanel.classList.contains('visible')) return;
    
    isDragging = true;
    els.adminPanel.classList.add('dragging');
    
    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }
    
    currentX = initialX;
    currentY = initialY;
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }
      
      xOffset = currentX;
      yOffset = currentY;
      
      setTranslate(currentX, currentY);
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    
    isDragging = false;
    els.adminPanel.classList.remove('dragging');
  }

  function setTranslate(xPos, yPos) {
    // Ensure panel stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = els.adminPanel.offsetWidth;
    const panelHeight = els.adminPanel.offsetHeight;
    
    // Constrain to viewport bounds
    const maxX = viewportWidth - panelWidth;
    const maxY = viewportHeight - panelHeight;
    const boundedX = Math.max(0, Math.min(xPos, maxX));
    const boundedY = Math.max(0, Math.min(yPos, maxY));
    
    els.adminPanel.style.left = `${boundedX}px`;
    els.adminPanel.style.top = `${boundedY}px`;
    els.adminPanel.style.right = 'auto';
    els.adminPanel.style.transform = 'none';
  }

  els.btnUpdateStatus?.addEventListener('click', async () => {
    if (!selectedIncidentId) return;
    
    const newStatus = els.statusSelect.value;
    const originalText = els.btnUpdateStatus.innerHTML;
    
    els.btnUpdateStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновяване...';
    els.btnUpdateStatus.disabled = true;

    try {
      await apiCall('PATCH', `/incidents/${selectedIncidentId}`, { status: statusToApi[newStatus] || newStatus }, true);
      showToast('Статусът е обновен успешно');
      
      // Reload incident details and refresh map
      loadIncidentDetails(selectedIncidentId);
      fetchIncidents();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Грешка при обновяване на статуса', true);
    } finally {
      els.btnUpdateStatus.innerHTML = originalText;
      els.btnUpdateStatus.disabled = false;
    }
  });

  els.btnSaveNotes?.addEventListener('click', async () => {
    if (!selectedIncidentId) return;
    
    const notes = els.adminNotes.value.trim();
    const originalText = els.btnSaveNotes.innerHTML;
    
    els.btnSaveNotes.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Запазване...';
    els.btnSaveNotes.disabled = true;

    try {
      await apiCall('PATCH', `/incidents/${selectedIncidentId}`, { admin_notes: notes }, true);
      showToast('Бележките са запазени успешно');
      
      // Reload incident details
      loadIncidentDetails(selectedIncidentId);
    } catch (err) {
      console.error('Error saving notes:', err);
      showToast('Грешка при запазване на бележките', true);
    } finally {
      els.btnSaveNotes.innerHTML = originalText;
      els.btnSaveNotes.disabled = false;
    }
  });

  els.btnDeleteIncident?.addEventListener('click', async () => {
    if (!selectedIncidentId) return;
    
    if (!confirm('Сигурни ли сте, че искате да изтриете този инцидент? Това действие е необратимо!')) {
      return;
    }

    const originalText = els.btnDeleteIncident.innerHTML;
    
    els.btnDeleteIncident.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Изтриване...';
    els.btnDeleteIncident.disabled = true;

    try {
      await apiCall('DELETE', `/incidents/${selectedIncidentId}`, null, true);
      showToast('Инцидентът е изтрит успешно');
      
      // Hide panel and refresh map
      hideAdminPanel();
      fetchIncidents();
    } catch (err) {
      console.error('Error deleting incident:', err);
      showToast('Грешка при изтриване на инцидента', true);
    } finally {
      els.btnDeleteIncident.innerHTML = originalText;
      els.btnDeleteIncident.disabled = false;
    }
  });

  function createMarkerIcon(status) {
    const colors = {
      deceased: '#ff4d4d',      // Ярко неоново червено
      wounded: '#ffbc00',      // Светещо кехлибарено
      investigating: '#ff9500', // Оранжево за разследване
      treated: '#00d4ff',      // Светещо синьо
      released: '#00ff88',     // Неоново изумрудено
      verified: '#9d4edd',     // Лилаво за потвърдено
      archived: '#6b7280'      // Сиво за архивирани
    };
    
    const color = colors[status] || '#6b7280';
    const isHandled = status === 'released' || status === 'treated';
    
    const iconHtml = `
      <div class="elegant-marker ${isHandled ? 'handled' : ''}" style="
        background: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 0 15px ${color}, 0 0 30px ${color}40;
        position: relative;
      ">
        ${isHandled ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4px; height: 4px; background: white; border-radius: 50%;"></div>' : ''}
      </div>
    `;
    
    return window.L.divIcon({
      html: iconHtml,
      iconSize: [18, 18],
      className: status === 'wounded' ? 'pulse-marker' : 'elegant-marker-wrapper',
    });
  }

  function createPopupContent(incident) {
    const statusMap = {
      deceased: 'Умряло',
      wounded: 'Ранено',
      investigating: 'Разследва се',
      treated: 'Лекувано',
      released: 'Освободено',
      verified: 'Потвърдено',
      archived: 'Архивирано'
    };
    
    let content = `
      <b>${escapeHtml(statusMap[incident.status] || incident.status)}</b><br/>
      ${escapeHtml(incident.species || 'Непознато')}
    `;
    
    // Add admin button if user is admin
    if (currentUser?.role === 'admin') {
      content += `<br/><button onclick="showAdminPanel(); showIncidentDetails(${incident.id});" style="margin-top:8px;padding:4px 8px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Детайли</button>`;
    }
    
    return content;
  }
};
