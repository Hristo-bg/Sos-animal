/**
 * SOS Animal - Demo Dashboard
 * Simplified dashboard with in-memory data
 */

(() => {
  // i18n system
  const i18n = {
    bg: {
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
  
  function updateLanguage() {
    const lang = i18n[currentLanguage];
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (lang[key]) {
        element.textContent = lang[key];
      }
    });
  }
  
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
  
  // Initialize current incidents with demo data
  window.currentIncidents = getInitialData();
  
  // Mobile pin mode state
  let isPinModeActive = false;
  
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
  
  // Demo state
  let map = null;
  let markersLayer = null;
  let markersById = new Map();
  let tempMarker = null;
  let pendingLat = null;
  let pendingLng = null;
  
  // Check user role from localStorage
  const userStr = localStorage.getItem('roadguardian_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';
  
  // Show admin panel button for admin users
  if (isAdmin) {
    const btnAdminPanel = document.getElementById('btnAdminPanel');
    const btnAdminPanelMobile = document.getElementById('btnAdminPanelMobile');
    if (btnAdminPanel) {
      btnAdminPanel.style.display = 'inline-flex';
      btnAdminPanel.addEventListener('click', () => {
        if (window.adminController) {
          window.adminController.showAdminPanel();
        }
      });
    }
    if (btnAdminPanelMobile) {
      btnAdminPanelMobile.style.display = 'flex';
    }
  }
  
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
  
  // Initialize map
  function initMap() {
    if (!window.L || !document.getElementById('mapCanvas')) return;
    
    map = window.L.map('mapCanvas', { zoomControl: true }).setView([42.7339, 25.4858], 7);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    // Set Bulgaria bounds
    const bounds = window.L.latLngBounds([41.2, 22.0], [44.3, 28.7]);
    map.setMaxBounds(bounds);
    map.setMinZoom(7);
    map.setMaxZoom(18);
    
    markersLayer = window.L.layerGroup().addTo(map);
    
    // Load demo incidents
    renderMarkers();
    
    // Double-click to add marker
    map.on('dblclick', (e) => {
      pendingLat = e.latlng.lat;
      pendingLng = e.latlng.lng;
      
      if (tempMarker) tempMarker.remove();
      
      tempMarker = window.L.marker([pendingLat, pendingLng], {
        icon: window.L.divIcon({
          className: 'pulse-lime-marker',
          html: '<div class="pulse-marker-container"><i class="fas fa-map-marker-alt" style="color:#ADFF2F;font-size:28px;"></i></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(map);
      
      // Update Lat/Long fields
      const reportLat = document.getElementById('reportLat');
      const reportLng = document.getElementById('reportLng');
      if (reportLat) reportLat.value = pendingLat.toFixed(6);
      if (reportLng) reportLng.value = pendingLng.toFixed(6);
    });
    
    // Single-click for mobile pin mode
    map.on('click', (e) => {
      if (!isPinModeActive) return;
      
      pendingLat = e.latlng.lat;
      pendingLng = e.latlng.lng;
      
      if (tempMarker) tempMarker.remove();
      
      tempMarker = window.L.marker([pendingLat, pendingLng], {
        icon: window.L.divIcon({
          className: 'pulse-lime-marker',
          html: '<div class="pulse-marker-container"><i class="fas fa-map-marker-alt" style="color:#ADFF2F;font-size:28px;"></i></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(map);
      
      // Update Lat/Long fields
      const reportLat = document.getElementById('reportLat');
      const reportLng = document.getElementById('reportLng');
      if (reportLat) reportLat.value = pendingLat.toFixed(6);
      if (reportLng) reportLng.value = pendingLng.toFixed(6);
      
      // Deactivate pin mode after placing marker
      isPinModeActive = false;
      const fabPin = document.getElementById('fabPin');
      if (fabPin) fabPin.classList.remove('active');
    });
  }
  
  // Render markers from window.currentIncidents
  function renderMarkers() {
    if (!markersLayer) return;
    
    markersLayer.clearLayers();
    markersById.clear();
    
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
      markersById.set(incident.id, marker);
    });
  }
  
  // Submit incident
  document.getElementById('btnSubmit')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const species = document.getElementById('species')?.value.trim();
    const status = statusMap[document.getElementById('status')?.value] || document.getElementById('status')?.value;
    const description = document.getElementById('description')?.value.trim();
    const contact = document.getElementById('contact')?.value.trim();
    const errEl = document.getElementById('formError');
    
    const reportLat = document.getElementById('reportLat')?.value.trim();
    const reportLng = document.getElementById('reportLng')?.value.trim();
    const lat = reportLat ? parseFloat(reportLat) : pendingLat;
    const lng = reportLng ? parseFloat(reportLng) : pendingLng;
    
    errEl.textContent = '';
    if (!lat || !lng) {
      errEl.textContent = 'Моля, кликнете върху картата или използвайте търсене на адрес';
      return;
    }
    if (!species || !status) {
      errEl.textContent = 'Моля, попълнете вид и статус';
      return;
    }
    
    // Add to window.currentIncidents
    const newIncident = {
      id: window.currentIncidents.length > 0 ? Math.max(...window.currentIncidents.map(i => i.id)) + 1 : 1,
      species,
      status,
      description,
      contact,
      lat,
      lng,
      reporter_email: user.email,
      created_at: new Date().toISOString(),
      resolved_at: null,
      admin_notes: '',
      photo_url: null
    };
    
    window.currentIncidents.push(newIncident);
    
    showToast('Сигналът е изпратен успешно');
    
    // Clear form
    document.getElementById('species').value = '';
    document.getElementById('status').value = 'ранено';
    document.getElementById('description').value = '';
    document.getElementById('contact').value = '';
    document.getElementById('manualAddress').value = '';
    document.getElementById('reportLat').value = '';
    document.getElementById('reportLng').value = '';
    
    if (tempMarker) tempMarker.remove();
    pendingLat = pendingLng = null;
    
    // Re-render markers
    renderMarkers();
    
    // Update admin panel if open
    if (window.adminController) {
      window.adminController.loadIncidents(true);
    }
  });
  
  // Address search with autocomplete
  let addressSearchTimeout = null;
  const addressInput = document.getElementById('manualAddress');
  const suggestionsList = document.getElementById('addressSuggestions');
  
  function searchAddress(query) {
    clearTimeout(addressSearchTimeout);
    
    if (!query || query.length < 2) {
      suggestionsList.style.display = 'none';
      suggestionsList.innerHTML = '';
      return;
    }
    
    addressSearchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=bg&limit=5&addressdetails=1&accept-language=bg`,
          {
            headers: {
              'User-Agent': 'SOS-Animal-Demo/1.0'
            }
          }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          suggestionsList.innerHTML = data.map(item => {
            const displayName = item.display_name || item.name || 'Неизвестен адрес';
            return `<li data-lat="${item.lat}" data-lon="${item.lon}" data-name="${displayName.replace(/"/g, '&quot;')}">${displayName}</li>`;
          }).join('');
          suggestionsList.style.display = 'block';
        } else {
          suggestionsList.innerHTML = '<li style="padding: 10px 14px; color: #94A3B8;">Няма намерени резултати</li>';
          suggestionsList.style.display = 'block';
        }
      } catch (error) {
        console.error('Address search error:', error);
        suggestionsList.innerHTML = '<li style="padding: 10px 14px; color: #EF4444;">Грешка при търсене</li>';
        suggestionsList.style.display = 'block';
      }
    }, 300);
  }
  
  addressInput?.addEventListener('input', (e) => {
    searchAddress(e.target.value.trim());
  });
  
  suggestionsList?.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li || !li.dataset.lat) return;
    
    const lat = parseFloat(li.dataset.lat);
    const lon = parseFloat(li.dataset.lon);
    const name = li.dataset.name;
    
    suggestionsList.style.display = 'none';
    addressInput.value = name;
    
    if (map) {
      map.flyTo([lat, lon], 16, { duration: 0.8 });
      
      if (tempMarker) tempMarker.remove();
      
      tempMarker = window.L.marker([lat, lon], {
        icon: window.L.divIcon({
          className: 'pulse-lime-marker',
          html: '<div class="pulse-marker-container"><i class="fas fa-paw" style="color:#ADFF2F;font-size:28px;"></i></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(map);
      
      const reportLat = document.getElementById('reportLat');
      const reportLng = document.getElementById('reportLng');
      if (reportLat) reportLat.value = lat.toFixed(6);
      if (reportLng) reportLng.value = lon.toFixed(6);
      
      showToast('Локацията е намерена!', false);
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.field[style*="position: relative"]')) {
      suggestionsList.style.display = 'none';
    }
  });
  
  // Current Location button
  document.getElementById('btnCurrentLocation')?.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (!navigator.geolocation) {
      showToast('Геолокацията не се поддържа от браузъра', true);
      return;
    }
    
    showToast('Търсене на местоположение...', false);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (map) {
          map.setView([lat, lng], 16);
          
          if (tempMarker) tempMarker.remove();
          
          tempMarker = window.L.marker([lat, lng], {
            icon: window.L.divIcon({
              className: 'pulse-lime-marker',
              html: '<div class="pulse-marker-container"><i class="fas fa-crosshairs" style="color:#ADFF2F;font-size:28px;"></i></div>',
              iconSize: [28, 28],
              iconAnchor: [14, 28],
            }),
          }).addTo(map);
          
          const reportLat = document.getElementById('reportLat');
          const reportLng = document.getElementById('reportLng');
          if (reportLat) reportLat.value = lat.toFixed(6);
          if (reportLng) reportLng.value = lng.toFixed(6);
          
          showToast('Местоположението е намерено!', false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        showToast('Грешка при намиране на местоположение', true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
  
  // Logout
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  
  // Initialize admin panel
  if (typeof initAdminPanel === 'function') {
    window.adminController = initAdminPanel({
      incidents: () => window.currentIncidents,
      updateIncident: (id, updates) => {
        const index = window.currentIncidents.findIndex(i => i.id === id);
        if (index !== -1) {
          window.currentIncidents[index] = { ...window.currentIncidents[index], ...updates };
          renderMarkers();
        }
      },
      deleteIncident: (id) => {
        const index = window.currentIncidents.findIndex(i => i.id === id);
        if (index !== -1) {
          window.currentIncidents.splice(index, 1);
          renderMarkers();
        }
      },
      statusColors: statusColors,
      showToast
    });
  }
  
  // Language toggle
  const btnLangToggle = document.getElementById('btnLangToggle');
  const currentLang = document.getElementById('currentLang');
  const btnLangToggleMobile = document.getElementById('btnLangToggleMobile');
  const currentLangMobile = document.getElementById('currentLangMobile');
  
  function toggleLanguage() {
    currentLanguage = currentLanguage === 'bg' ? 'en' : 'bg';
    currentLang.textContent = currentLanguage.toUpperCase();
    if (currentLangMobile) currentLangMobile.textContent = currentLanguage.toUpperCase();
    updateLanguage();
  }
  
  btnLangToggle?.addEventListener('click', toggleLanguage);
  btnLangToggleMobile?.addEventListener('click', toggleLanguage);
  
  // Mobile menu toggle
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  const btnCloseMobileMenu = document.getElementById('btnCloseMobileMenu');
  const mobileMenu = document.getElementById('mobileMenu');
  
  btnMobileMenu?.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  
  btnCloseMobileMenu?.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (mobileMenu && !mobileMenu.contains(e.target) && !btnMobileMenu?.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
  
  // Mobile menu buttons
  const btnDemoInfoMobile = document.getElementById('btnDemoInfoMobile');
  const btnAdminPanelMobile = document.getElementById('btnAdminPanelMobile');
  const btnLogoutMobile = document.getElementById('btnLogoutMobile');
  
  btnDemoInfoMobile?.addEventListener('click', () => {
    showDemoInfo();
    mobileMenu.classList.remove('open');
  });
  
  btnAdminPanelMobile?.addEventListener('click', () => {
    if (window.adminController) {
      window.adminController.showAdminPanel();
    }
    mobileMenu.classList.remove('open');
  });
  
  btnLogoutMobile?.addEventListener('click', () => {
    localStorage.removeItem('roadguardian_user');
    window.location.href = 'index.html';
  });
  
  // FAB Button for Mobile Pin Mode
  const fabPin = document.getElementById('fabPin');
  fabPin?.addEventListener('click', () => {
    isPinModeActive = !isPinModeActive;
    fabPin.classList.toggle('active', isPinModeActive);
    
    // Change cursor when pin mode is active
    if (map) {
      map.getContainer().style.cursor = isPinModeActive ? 'crosshair' : '';
    }
  });
  
  // Demo Info Modal
  const btnDemoInfo = document.getElementById('btnDemoInfo');
  const demoInfoWindow = document.getElementById('demoInfoWindow');
  const btnCloseDemoInfo = document.getElementById('btnCloseDemoInfo');
  const btnGotIt = document.getElementById('btnGotIt');
  
  function showDemoInfo() {
    demoInfoWindow.classList.add('visible');
  }
  
  function hideDemoInfo() {
    demoInfoWindow.classList.remove('visible');
  }
  
  btnDemoInfo?.addEventListener('click', showDemoInfo);
  btnCloseDemoInfo?.addEventListener('click', hideDemoInfo);
  btnGotIt?.addEventListener('click', hideDemoInfo);
  
  // Close modal when clicking outside
  demoInfoWindow?.addEventListener('click', (e) => {
    if (e.target === demoInfoWindow) {
      hideDemoInfo();
    }
  });
  
  // Initialize language
  updateLanguage();
  
  // Initialize map on load
  setTimeout(() => {
    initMap();
    showToast('Система в ДЕМО РЕЖИМ', false);
  }, 100);
})();
