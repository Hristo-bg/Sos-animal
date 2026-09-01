(() => {
  // Security Guard
  const token = localStorage.getItem('roadguardian_token');
  const user = JSON.parse(localStorage.getItem('roadguardian_user') || '{}');
  
  console.log('Dashboard: User data:', user);
  console.log('Dashboard: User role:', user.role);
  console.log('Dashboard: Token exists:', !!token);
  
  if (!token || !user.email) {
    window.location.href = 'index.html';
    return;
  }

  // API config
  const API_BASE = 'http://localhost:3333/api';

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

  // i18n system
  const i18n = {
    bg: {
      reportTitle: 'Подаване на сигнал',
      reportInstructions: 'Натисни върху картата, за да маркираш място',
      instructionBg: 'Кликни два пъти за маркер',
      instructionEn: 'Double click to place a marker',
      admin: 'Админ',
      logout: 'Изход',
      quickSteps: 'Бързи Стъпки',
      locateStep: 'Локализирай',
      locateDesc: 'Двойно кликване върху картата за маркиране на инцидент',
      submitStep: 'Изпрати',
      submitDesc: 'Попълнете детайли и изпратете доклад',
      helpStep: 'Помогнете на Животни',
      helpDesc: 'Професионални екипи ще координират спасяването'
    },
    en: {
      reportTitle: 'Report Incident',
      reportInstructions: 'Click on the map to mark a location',
      instructionBg: 'Кликни два пъти за маркер',
      instructionEn: 'Double click to place a marker',
      admin: 'Admin',
      logout: 'Logout',
      quickSteps: 'Quick Steps',
      locateStep: 'Locate',
      locateDesc: 'Double-click on the map to mark incident location',
      submitStep: 'Submit',
      submitDesc: 'Fill in incident details and send report',
      helpStep: 'Help Animals',
      helpDesc: 'Professional teams will coordinate rescue response'
    }
  };

  let currentLanguage = localStorage.getItem('sos_animal_language') || 'bg';

  // Update all text elements with current language
  function updateLanguage() {
    const lang = i18n[currentLanguage];
    
    // Update elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (lang[key]) {
        element.textContent = lang[key];
      }
    });
    
    // Update language toggle button
    const currentLangElement = document.getElementById('currentLang');
    if (currentLangElement) {
      currentLangElement.textContent = currentLanguage.toUpperCase();
    }
    
    // Update body class for language-specific styling
    document.body.className = document.body.className.replace(/lang-\w+/g, '');
    document.body.classList.add(`lang-${currentLanguage}`);
  }

  // Language toggle handler
  function setupLanguageToggle() {
    const btnLangToggle = document.getElementById('btnLangToggle');
    if (btnLangToggle) {
      btnLangToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLanguage = currentLanguage === 'bg' ? 'en' : 'bg';
        updateLanguage();
        localStorage.setItem('sos_animal_language', currentLanguage);
      });
    }
    
    // Update language on load
    updateLanguage();
  }

  // Toast
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

  // Show admin panel for admin users
  console.log('Dashboard: Checking admin role, user.role =', user.role);
  if (user.role === 'admin') {
    const adminBtn = document.getElementById('btnAdminPanel');
    if (adminBtn) {
      adminBtn.style.display = 'block';
      console.log('Dashboard: Admin button shown for user:', user.email);
      showToast('Admin panel access enabled', false);
    } else {
      console.error('Dashboard: Admin panel button not found');
    }
  } else {
    console.log('Dashboard: User is not admin, button hidden');
    showToast(`Access denied. Current role: ${user.role || 'unknown'}. Admin role required.`, true);
  }

  // Logout
  document.getElementById('btnLogout').addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.removeItem('roadguardian_token');
    localStorage.removeItem('roadguardian_user');
    window.location.href = 'index.html';
  });

  // Map
  let map, markersLayer, tempMarker;
  let pendingLat, pendingLng;

  function initMap() {
    console.log('Dashboard: Initializing map...');
    console.log('Dashboard: window.L exists:', !!window.L);
    
    if (!window.L) {
      console.error('Dashboard: Leaflet not loaded');
      return;
    }
    
    const mapContainer = document.getElementById('mapCanvas');
    console.log('Dashboard: Map container found:', !!mapContainer);
    
    if (!mapContainer) {
      console.error('Dashboard: Map container not found');
      return;
    }
    
    // Check container dimensions
    const rect = mapContainer.getBoundingClientRect();
    console.log('Dashboard: Map container dimensions:', rect.width, 'x', rect.height);
    console.log('Dashboard: Map container computed style:', window.getComputedStyle(mapContainer).height);
    
    if (rect.width === 0 || rect.height === 0) {
      console.error('Dashboard: Map container has zero dimensions');
      // Force dimensions
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100vh';
      console.log('Dashboard: Forced dimensions applied');
      setTimeout(() => initMap(), 500);
      return;
    }
    
    map = window.L.map('mapCanvas', { zoomControl: true }).setView([42.7339, 25.4858], 7);
    
    console.log('Adding tile layer...');
    const tiles = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: ' OpenStreetMap contributors  CARTO',
      maxZoom: 19
    }).addTo(map);
    
    // Set cursor styles
    map.getContainer().style.cursor = 'crosshair';
    map.on('mousemove', () => {
      map.getContainer().style.cursor = 'crosshair';
    });
    map.on('mouseout', () => {
      map.getContainer().style.cursor = 'crosshair';
    });
    
    // Add error handling for tile loading
    tiles.on('tileerror', (e) => {
      console.error('Dashboard: Tile loading error:', e);
    });
    
    tiles.on('tileload', (e) => {
      console.log('Dashboard: Tile loaded successfully');
    });
    
    console.log('Dashboard: Map initialized successfully');
    
    markersLayer = window.L.layerGroup().addTo(map);
    
    // Bulgaria bounds only
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

    // Double-click to place marker
    map.on('dblclick', (e) => {
      const { lat, lng } = e.latlng;
      pendingLat = lat;
      pendingLng = lng;
      
      // Remove previous temp marker
      if (tempMarker) tempMarker.remove();
      
      // Add paw icon marker
      tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-paw-marker',
          html: '<i class="fas fa-paw" style="color: var(--forest); font-size: 20px;"></i>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map);
      
      // Auto-fill form fields
      if (els.species) els.species.value = '';
      if (els.status) els.status.value = 'ранено';
      if (els.reportLat) els.reportLat.value = lat.toFixed(6);
      if (els.reportLng) els.reportLng.value = lng.toFixed(6);
      
      // Show toast notification
      showToast('Мястото е маркирано. Попълнете детайлите вдясно.', false);
    });

    fetchMyIncidents();
    
    // Load all incidents for admin users
    if (user.role === 'admin') {
      fetchAllIncidents();
    }

    // Force map to render properly
    setTimeout(() => {
      map.invalidateSize();
      console.log('Dashboard: Map size invalidated, forcing re-render');
    }, 500);
  }

  // Submit incident
  document.getElementById('btnSubmit').addEventListener('click', async (e) => {
    e.stopPropagation();
    const species = document.getElementById('species').value.trim();
    const status = statusMap[document.getElementById('status').value] || document.getElementById('status').value;
    const description = document.getElementById('description').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const photo = document.getElementById('photo').files[0];
    const errEl = document.getElementById('formError');
    
    errEl.textContent = '';
    
    if (!pendingLat || !pendingLng) {
      errEl.textContent = 'Моля, кликнете върху картата, за да маркирате място';
      return;
    }
    
    if (!species || !status) {
      errEl.textContent = 'Моля, попълнете вид и статус';
      return;
    }
    
    const formData = new FormData();
    formData.append('lat', pendingLat);
    formData.append('lng', pendingLng);
    formData.append('species', species);
    formData.append('status', status);
    formData.append('description', description);
    formData.append('contact', contact);
    if (photo) formData.append('photo', photo);
    
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error('Грешка при изпращане');
      
      const submitBtn = document.getElementById('btnSubmit');
      submitBtn.style.background = '#10B981';
      submitBtn.textContent = 'Готово!';
      submitBtn.disabled = true;
      
      setTimeout(() => {
        submitBtn.style.background = '';
        submitBtn.textContent = 'Изпрати';
        submitBtn.disabled = false;
      }, 2000);
      
      showToast('Сигналът е изпратен успешно');
      // Clear form inputs immediately
      document.getElementById('species').value = '';
      document.getElementById('status').value = 'ранено';
      document.getElementById('description').value = '';
      document.getElementById('contact').value = '';
      document.getElementById('photo').value = '';
      if (tempMarker) tempMarker.remove();
      pendingLat = pendingLng = null;
      
      fetchMyIncidents();
      if (user.role === 'admin') fetchAllIncidents();
    } catch (err) {
      console.error('Submit error:', err);
      errEl.textContent = 'Грешка при изпращане. Опитайте отново.';
    }
  });

  // Fetch my incidents with auto-refresh
  async function fetchMyIncidents() {
    try {
      const res = await fetch(`${API_BASE}/incidents/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Грешка при зареждане');
      const incidents = await res.json();
      renderMyIncidents(incidents);
    } catch (err) {
      console.error('Error fetching my incidents:', err);
    }
  }

  // Render my incidents
  function renderMyIncidents(incidents) {
    const container = document.getElementById('myIncidentsList');
    if (incidents.length === 0) {
      container.innerHTML = '<p>Все още нямате подадени сигнали</p>';
      return;
    }
    
    container.innerHTML = incidents.map(inc => `
      <div class="myIncident">
        <div class="myIncidentHeader">
          <strong>${inc.species || 'Непознато'}</strong>
          <span class="status-${inc.status}">${inc.status}</span>
        </div>
        <div class="myIncidentMeta">
          <small>${new Date(inc.created_at).toLocaleDateString('bg-BG')}</small>
          ${inc.resolved_at ? `<small style="color:green;">Разрешено</small>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Fetch all incidents (admin only)
  async function fetchAllIncidents() {
    if (user.role !== 'admin') return;
    
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Грешка при зареждане');
      const incidents = await res.json();
      
      if (markersLayer) {
        markersLayer.clearLayers();
        incidents.forEach(inc => {
          const icon = window.L.divIcon({
            html: `<i class="fas fa-paw" style="color:${getStatusColor(inc.status)};font-size:20px;"></i>`,
            iconSize: [20, 20],
            className: ''
          });
          const marker = window.L.marker([inc.lat, inc.lng], { icon })
            .bindPopup(`
              <div style="min-width:200px;">
                <strong>${inc.species || 'Непознато'}</strong><br>
                Статус: ${inc.status}<br>
                ${inc.description ? `Описание: ${inc.description}<br>` : ''}
                <small>${new Date(inc.created_at).toLocaleDateString('bg-BG')}</small><br>
                <button onclick="showAdminPanel(); showIncidentDetails(${inc.id});" style="margin-top:8px;padding:4px 8px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Детайли</button>
              </div>
            `);
          markersLayer.addLayer(marker);
        });
      }
    } catch (err) {
      console.error('Error fetching all incidents:', err);
    }
  }

  function getStatusColor(status) {
    const colors = {
      'умряло': '#ef4444',
      'ранено': '#fbbf24',
      'изчистено': '#10b981'
    };
    return colors[status] || '#6b7280';
  }

  // Admin Panel functionality (only for admin users)
  if (user.role === 'admin') {
    let selectedIncidentId = null;
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Admin panel elements
    const adminPanel = document.getElementById('adminPanel');
    const btnCloseAdmin = document.getElementById('btnCloseAdmin');
    const btnAdminPanel = document.getElementById('btnAdminPanel');
    const incidentDetails = document.getElementById('incidentDetails');
    const statusSelect = document.getElementById('statusSelect');
    const adminNotes = document.getElementById('adminNotes');
    const btnUpdateStatus = document.getElementById('btnUpdateStatus');
    const btnSaveNotes = document.getElementById('btnSaveNotes');
    const btnDeleteIncident = document.getElementById('btnDeleteIncident');

    // Show/hide admin panel
    function showAdminPanel() {
      adminPanel.classList.add('visible');
      
      // Center the panel if it's the first time opening
      if (!adminPanel.dataset.initialized) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const panelWidth = 380; // Fixed width
        const panelHeight = 400; // Minimum height
        
        // Center in viewport with bounds checking
        const centerX = Math.max(20, Math.min((viewportWidth - panelWidth) / 2, viewportWidth - panelWidth - 20));
        const centerY = Math.max(20, Math.min((viewportHeight - panelHeight) / 2, viewportHeight - panelHeight - 20));
        
        adminPanel.style.left = `${centerX}px`;
        adminPanel.style.top = `${centerY}px`;
        adminPanel.style.right = 'auto';
        adminPanel.dataset.initialized = 'true';
      }
      
      // Load incidents when panel opens
      loadIncidentsList();
    }

    function hideAdminPanel() {
      adminPanel.classList.remove('visible');
      selectedIncidentId = null;
    }

    // Load incidents list
    function loadIncidentsList(filter = '') {
      const container = document.getElementById('incidentsContainer');
      container.innerHTML = '<div class="loadingMessage">Зареждане на инциденти...</div>';
      
      fetch(`${API_BASE}/incidents${filter ? `?status=${filter}` : ''}`)
        .then(res => {
          if (!res.ok) throw new Error('Грешка при зареждане на инциденти');
          return res.json();
        })
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
        const displayName = (incident.reporter_email === user.email) ? 
          `${user.email} (Вие)` : 
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
      const incidentsList = document.getElementById('incidentsList');
      const incidentDetails = document.getElementById('incidentDetails');
      
      if (incidentsList) incidentsList.style.display = 'none';
      if (incidentDetails) incidentDetails.style.display = 'block';
      
      // Fetch incident details and auto-focus map
      fetch(`${API_BASE}/incidents/${incidentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Incident not found');
        return res.json();
      })
      .then(incident => {
        if (incident.lat && incident.lng) {
          map.panTo([incident.lat, incident.lng], {
            animate: true,
            duration: 1
          });
        }
      })
      .catch(err => {
        console.error('Error fetching incident details:', err);
        // Show clean, human-readable message
        const incidentDetails = document.getElementById('incidentDetails');
        if (incidentDetails) {
          incidentDetails.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--forest);">
              <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; color: var(--forest);"></i>
              <h3>Няма информация за този инцидент</h3>
              <p>Опитайте пак.</p>
              <button onclick="backToList()" class="btn btnPrimary" style="margin-top: 1rem;">Обратно към списъка</button>
            </div>
          `;
        }
      });
    }

    // Back to list
    function backToList() {
      // Hide details view, show list view
      document.getElementById('incidentDetailsView').style.display = 'none';
      document.getElementById('incidentsList').style.display = 'block';
      selectedIncidentId = null;
    }

    // Load incident details
    function loadIncidentDetails(incidentId) {
      selectedIncidentId = incidentId;
      
      incidentDetails.innerHTML = `
        <h4>Инцидент детайли</h4>
        <div class="detailLoading">Зареждане...</div>
      `;

      fetch(`${API_BASE}/incidents/${incidentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Грешка при зареждане на детайли');
        return res.json();
      })
      .then(incident => {
        displayIncidentDetails(incident);
      })
      .catch(err => {
        console.error('Error loading incident details:', err);
        incidentDetails.innerHTML = '<div class="detailLoading">Грешка при зареждане</div>';
        showToast('Грешка при зареждане на детайли', true);
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

      // Show current user's name if they reported this incident
      const reporterDisplay = (incident.reporter_email === user.email) ? 
        `${user.email} (Вие)` : 
        (incident.reporter_email || 'Анонимен');

      incidentDetails.innerHTML = `
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
      ${incident.resolver_email ? `
        <div class="detailItem">
          <strong>Обработено от:</strong> ${incident.resolver_email}
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
          <img src="http://localhost:3333${incident.photo_url}" alt="Incident photo" style="max-width: 100%; border-radius: 8px; margin-top: 0.5rem;">
        </div>
      ` : ''}
      `;

      statusSelect.value = incident.status;
      adminNotes.value = incident.admin_notes || '';
    }

    // Event listeners
    btnAdminPanel.addEventListener('click', (e) => {
      e.stopPropagation();
      showAdminPanel();
    });
    btnCloseAdmin.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAdminPanel();
    });
    
    // New event listeners
    document.getElementById('btnRefreshList')?.addEventListener('click', () => {
      const filter = document.getElementById('filterStatus').value;
      loadIncidentsList(filter);
    });
    
    document.getElementById('filterStatus')?.addEventListener('change', (e) => {
      loadIncidentsList(e.target.value);
    });
    
    document.getElementById('btnBackToList')?.addEventListener('click', backToList);

    // Window controls
    const minimizeBtn = adminPanel.querySelector('.windowControl.minimize');
    const maximizeBtn = adminPanel.querySelector('.windowControl.maximize');
    
    minimizeBtn?.addEventListener('click', () => {
      adminPanel.style.height = '60px';
      adminPanel.style.overflow = 'hidden';
      adminPanel.querySelector('.adminPanelContent').style.display = 'none';
      minimizeBtn.style.background = '#10b981';
      maximizeBtn.style.background = '#fbbf24';
    });
    
    maximizeBtn?.addEventListener('click', () => {
      adminPanel.style.height = '';
      adminPanel.style.maxHeight = '';
      adminPanel.style.overflow = '';
      adminPanel.querySelector('.adminPanelContent').style.display = 'block';
      maximizeBtn.style.background = '#fbbf24';
      minimizeBtn.style.background = '#10b981';
    });

    // Quick status change
    window.quickStatusChange = function(incidentId, newStatus) {
      if (!token || !user.role === 'admin') return;
      
      const originalText = btnUpdateStatus.innerHTML;
      
      if (btnUpdateStatus) {
        btnUpdateStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновяване...';
        btnUpdateStatus.disabled = true;
      }
      
      fetch(`${API_BASE}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: statusToApi[newStatus] || newStatus })
      })
      .then(res => {
        if (!res.ok) throw new Error('Грешка при обновяване на статуса');
        
        showToast('Статусът е обновен успешно');
        loadIncidentDetails(incidentId);
        fetchMyIncidents();
        // Refresh map markers
        if (map && markersLayer) {
          markersLayer.clearLayers();
          fetchAllIncidents();
        }
      })
      .catch(err => {
        console.error('Error updating status:', err);
        showToast('Грешка при обновяване на статуса', true);
      })
      .finally(() => {
        if (btnUpdateStatus) {
          btnUpdateStatus.innerHTML = originalText;
          btnUpdateStatus.disabled = false;
        }
      });
    };

    // Drag functionality
    if (adminPanel && document.querySelector('.adminPanelHeader')) {
      const adminPanelHeader = document.querySelector('.adminPanelHeader');
      adminPanelHeader.addEventListener('mousedown', dragStart);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
      
      // Touch events for mobile
      adminPanelHeader.addEventListener('touchstart', dragStart);
      document.addEventListener('touchmove', drag);
      document.addEventListener('touchend', dragEnd);
    }

    function dragStart(e) {
      if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }

      if (e.target === adminPanel || adminPanel.contains(e.target)) {
        isDragging = true;
        adminPanel.classList.add('dragging');
      }
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
      adminPanel.classList.remove('dragging');
    }

    function setTranslate(xPos, yPos) {
      // Ensure panel stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = adminPanel.offsetWidth;
      const panelHeight = adminPanel.offsetHeight;
      
      // Constrain to viewport bounds
      const maxX = viewportWidth - panelWidth;
      const maxY = viewportHeight - panelHeight;
      const boundedX = Math.max(0, Math.min(xPos, maxX));
      const boundedY = Math.max(0, Math.min(yPos, maxY));
      
      adminPanel.style.left = `${boundedX}px`;
      adminPanel.style.top = `${boundedY}px`;
      adminPanel.style.right = 'auto';
      adminPanel.style.transform = 'none';
    }

    btnUpdateStatus.addEventListener('click', async () => {
      if (!selectedIncidentId) return;
      
      const newStatus = statusSelect.value;
      const originalText = btnUpdateStatus.innerHTML;
      
      btnUpdateStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновяване...';
      btnUpdateStatus.disabled = true;
      
      try {
        const res = await fetch(`${API_BASE}/incidents/${selectedIncidentId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: statusToApi[newStatus] || newStatus })
        });
        
        if (!res.ok) throw new Error('Грешка при обновяване');
        
        showToast('Статусът е обновен успешно');
        loadIncidentDetails(selectedIncidentId);
        fetchMyIncidents();
        // Refresh map markers
        if (map && markersLayer) {
          markersLayer.clearLayers();
          // Update marker color instantly without refresh
          if (markersLayer) {
            markersLayer.eachLayer(layer => {
              if (layer.incidentId === selectedIncidentId) {
                const statusColor = getStatusColor(newStatus);
                layer.setIcon(createMarkerIcon(statusColor));
              }
            });
          }
          fetchAllIncidents();
        }
      } catch (err) {
        console.error('Error updating status:', err);
        showToast('Грешка при обновяване на статуса', true);
      } finally {
        btnUpdateStatus.disabled = false;
        btnUpdateStatus.innerHTML = originalText;
      }
    });

    // Helper function to get status color
    function getStatusColor(status) {
      const colors = {
        'wounded': '#ef4444',
        'deceased': '#6b7280',
        'handled': '#10b981'
      };
      return colors[status] || '#6b7280';
    }

    // Helper function to create marker icon
    function createMarkerIcon(color) {
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
    }

    btnSaveNotes.addEventListener('click', async () => {
      if (!selectedIncidentId) return;
      
      const notes = adminNotes.value.trim();
      const originalText = btnSaveNotes.innerHTML;
      
      btnSaveNotes.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Запазване...';
      btnSaveNotes.disabled = true;
      
      try {
        const res = await fetch(`${API_BASE}/incidents/${selectedIncidentId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ admin_notes: notes })
        });
        
        if (!res.ok) throw new Error('Грешка при запазване');
        
        showToast('Бележките са запазени успешно');
        loadIncidentDetails(selectedIncidentId);
      } catch (err) {
        console.error('Error saving notes:', err);
        showToast('Грешка при запазване на бележките', true);
      } finally {
        btnSaveNotes.innerHTML = originalText;
        btnSaveNotes.disabled = false;
      }
    });

    btnDeleteIncident.addEventListener('click', async () => {
      if (!selectedIncidentId) return;
      
      if (!confirm('Сигурни ли сте, че искате да премахнете този маркер?')) return;
      
      const originalText = btnDeleteIncident.innerHTML;
      
      btnDeleteIncident.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Изтриване...';
      btnDeleteIncident.disabled = true;
      
      try {
        const res = await fetch(`${API_BASE}/incidents/${selectedIncidentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Грешка при изтриване');
        
        showToast('Инцидентът е изтрит успешно');
        backToList();
        loadIncidentsList();
        fetchMyIncidents();
        // Refresh map markers
        if (map && markersLayer) {
          markersLayer.clearLayers();
          fetchAllIncidents();
        }
      } catch (err) {
        console.error('Error deleting incident:', err);
        showToast('Грешка при изтриване на инцидента', true);
      } finally {
        btnDeleteIncident.innerHTML = originalText;
        btnDeleteIncident.disabled = false;
      }
    });

    // Mobile sidebar handle functionality
    const sidebarHandle = document.getElementById('sidebarHandle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarHandle && sidebar) {
      sidebarHandle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        const icon = sidebarHandle.querySelector('i');
        if (sidebar.classList.contains('open')) {
          icon.className = 'fas fa-chevron-down';
          sidebarHandle.innerHTML = '<i class="fas fa-chevron-down"></i> Скрий детайлите';
        } else {
          icon.className = 'fas fa-chevron-up';
          sidebarHandle.innerHTML = '<i class="fas fa-chevron-up"></i> Детайли на сигнала';
        }
      });
      
      // Auto-open sidebar on mobile when marker is placed
      if (window.innerWidth <= 768) {
        map.on('dblclick', () => {
          setTimeout(() => {
            sidebar.classList.add('open');
            sidebarHandle.innerHTML = '<i class="fas fa-chevron-down"></i> Скрий детайлите';
          }, 100);
        });
      }
    }

    // Make functions global for onclick handlers
    window.showIncidentDetails = showIncidentDetails;
    window.backToList = backToList;
    window.loadIncidentsList = loadIncidentsList;
  }

  // Init
  console.log('Dashboard: Starting initialization...');
  
  // Setup language toggle
  setupLanguageToggle();
  
  setTimeout(() => {
    console.log('Dashboard: Calling initMap()...');
    initMap();
  }, 100);
})();
