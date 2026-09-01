(() => {
  const token = localStorage.getItem('roadguardian_token');
  const user = JSON.parse(localStorage.getItem('roadguardian_user') || '{}');

  if (!token || !user.email) {
    window.location.href = 'index.html';
    return;
  }

  const API_BASE = '/api';

  const statusMap = {
    'умряло': 'deceased',
    'ранено': 'wounded',
    'изчистено': 'handled',
  };

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
      locateDesc: 'Двойно кликване върху картата',
      submitStep: 'Изпрати',
      submitDesc: 'Попълнете детайли и изпратете',
      helpStep: 'Помогнете',
      helpDesc: 'Екипите координират спасяването',
    },
    en: {
      reportTitle: 'Report Incident',
      reportInstructions: 'Click on the map to mark a location',
      instructionBg: 'Double click for marker',
      instructionEn: 'Double click to place a marker',
      admin: 'Admin',
      logout: 'Logout',
      quickSteps: 'Quick Steps',
      locateStep: 'Locate',
      locateDesc: 'Double-click on the map',
      submitStep: 'Submit',
      submitDesc: 'Fill details and send report',
      helpStep: 'Help',
      helpDesc: 'Teams coordinate rescue',
    },
  };

  let currentLanguage = localStorage.getItem('sos_animal_language') || 'bg';
  let map = null;
  let markersLayer = null;
  let tempMarker = null;
  let highlightMarker = null;
  let mapReady = false;
  let pendingLat = null;
  let pendingLng = null;
  let adminController = null;

  function updateLanguage() {
    const lang = i18n[currentLanguage];
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (lang[key]) element.textContent = lang[key];
    });
    const currentLangElement = document.getElementById('currentLang');
    if (currentLangElement) currentLangElement.textContent = currentLanguage.toUpperCase();
    document.body.className = document.body.className.replace(/lang-\w+/g, '');
    document.body.classList.add('dashboard-page', `lang-${currentLanguage}`);
  }

  function setupLanguageToggle() {
    document.getElementById('btnLangToggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLanguage = currentLanguage === 'bg' ? 'en' : 'bg';
      updateLanguage();
      localStorage.setItem('sos_animal_language', currentLanguage);
    });
    updateLanguage();
  }

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

  function getStatusColor(status) {
    const colors = {
      wounded: '#FBBF24',
      deceased: '#EF4444',
      handled: '#10B981',
      investigating: '#F97316',
      treated: '#38BDF8',
      released: '#34D399',
      verified: '#A78BFA',
      archived: '#94A3B8',
      умряло: '#EF4444',
      ранено: '#FBBF24',
      изчистено: '#10B981',
    };
    return colors[status] || '#6b7280';
  }

  function refreshMapSize() {
    if (map) {
      map.invalidateSize({ animate: false });
    }
  }

  function clearHighlight() {
    if (highlightMarker) {
      highlightMarker.remove();
      highlightMarker = null;
    }
  }

  function focusIncidentOnMap(inc) {
    if (!map || !inc) return;
    const lat = Number(inc.lat);
    const lng = Number(inc.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    clearHighlight();
    highlightMarker = window.L.marker([lat, lng], {
      icon: window.L.divIcon({
        className: 'admin-focus-marker',
        html: '<div style="width:22px;height:22px;border-radius:50%;background:#ADFF2F;border:3px solid #1A2A2A;box-shadow:0 0 12px rgba(173,255,47,0.9);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      zIndexOffset: 1000,
    }).addTo(map);

    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }

  function initMap() {
    if (mapReady || map) return;
    if (!window.L) {
      console.error('Leaflet not loaded');
      setTimeout(initMap, 200);
      return;
    }

    const mapContainer = document.getElementById('mapCanvas');
    if (!mapContainer) return;

    if (mapContainer._leaflet_id) {
      try {
        mapContainer._leaflet_id = null;
      } catch (_) {}
    }

    const rect = mapContainer.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) {
      setTimeout(initMap, 200);
      return;
    }

    map = window.L.map(mapContainer, {
      zoomControl: true,
      preferCanvas: true,
    }).setView([42.7339, 25.4858], 7);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.getContainer().style.cursor = 'crosshair';
    markersLayer = window.L.layerGroup().addTo(map);

    const bounds = window.L.latLngBounds([41.2, 22.0], [44.3, 28.7]);
    map.setMaxBounds(bounds);
    map.setMinZoom(7);
    map.setMaxZoom(18);
    map.on('drag', () => {
      if (!bounds.contains(map.getBounds().getSouthWest())) {
        map.panInsideBounds(bounds, { animate: false });
      }
    });

    map.on('dblclick', (e) => {
      window.L.DomEvent.stopPropagation(e);
      const { lat, lng } = e.latlng;
      pendingLat = lat;
      pendingLng = lng;
      if (tempMarker) tempMarker.remove();
      tempMarker = window.L.marker([lat, lng], {
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
      if (reportLat) reportLat.value = lat.toFixed(6);
      if (reportLng) reportLng.value = lng.toFixed(6);

      const statusEl = document.getElementById('status');
      if (statusEl) statusEl.value = 'ранено';
      showToast('Мястото е маркирано. Попълнете детайлите вдясно.', false);
    });

    mapReady = true;

    if (adminController) {
      adminController.config.map = map;
    }

    fetchMyIncidents();
    if (user.role === 'admin') fetchAllIncidents();

    setTimeout(refreshMapSize, 100);
    setTimeout(refreshMapSize, 500);
    window.addEventListener('resize', refreshMapSize);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => refreshMapSize());
      ro.observe(mapContainer);
    }
  }

  // Address search with autocomplete using Nominatim API
  let addressSearchTimeout = null;
  const addressInput = document.getElementById('manualAddress');
  const suggestionsList = document.getElementById('addressSuggestions');

  // Debounced search function
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
              'User-Agent': 'SOS-Animal-App/1.0'
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

  // Input event for autocomplete
  addressInput?.addEventListener('input', (e) => {
    searchAddress(e.target.value.trim());
  });

  // Handle suggestion click
  suggestionsList?.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li || !li.dataset.lat) return;
    
    const lat = parseFloat(li.dataset.lat);
    const lon = parseFloat(li.dataset.lon);
    const name = li.dataset.name;
    
    // Hide suggestions
    suggestionsList.style.display = 'none';
    
    // Update input value
    addressInput.value = name;
    
    // Fly to location on map
    if (map) {
      map.flyTo([lat, lon], 16, { duration: 0.8 });
      
      // Remove previous temp marker
      if (tempMarker) tempMarker.remove();
      
      // Add SOS Paw icon marker
      tempMarker = window.L.marker([lat, lon], {
        icon: window.L.divIcon({
          className: 'pulse-lime-marker',
          html: '<div class="pulse-marker-container"><i class="fas fa-paw" style="color:#ADFF2F;font-size:28px;"></i></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(map);
      
      // Update Lat/Long fields
      const reportLat = document.getElementById('reportLat');
      const reportLng = document.getElementById('reportLng');
      if (reportLat) reportLat.value = lat.toFixed(6);
      if (reportLng) reportLng.value = lon.toFixed(6);
      
      showToast('Локацията е намерена!', false);
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.field[style*="position: relative"]')) {
      suggestionsList.style.display = 'none';
    }
  });

  // Manual search button (fallback)
  document.getElementById('btnFindAddress')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const address = addressInput?.value.trim();
    
    if (!address) {
      showToast('Моля, въведете адрес', true);
      return;
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=bg&limit=1&addressdetails=1&accept-language=bg`,
        {
          headers: {
            'User-Agent': 'SOS-Animal-App/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        // Fly to location on map
        if (map) {
          map.flyTo([lat, lon], 16, { duration: 0.8 });
          
          // Remove previous temp marker
          if (tempMarker) tempMarker.remove();
          
          // Add SOS Paw icon marker
          tempMarker = window.L.marker([lat, lon], {
            icon: window.L.divIcon({
              className: 'pulse-lime-marker',
              html: '<div class="pulse-marker-container"><i class="fas fa-paw" style="color:#ADFF2F;font-size:28px;"></i></div>',
              iconSize: [28, 28],
              iconAnchor: [14, 28],
            }),
          }).addTo(map);
          
          // Update Lat/Long fields
          const reportLat = document.getElementById('reportLat');
          const reportLng = document.getElementById('reportLng');
          if (reportLat) reportLat.value = lat.toFixed(6);
          if (reportLng) reportLng.value = lon.toFixed(6);
          
          showToast('Локацията е намерена!', false);
        }
      } else {
        showToast('Адресът не е намерен', true);
      }
    } catch (error) {
      console.error('Address search error:', error);
      showToast('Грешка при търсене на адрес', true);
    }
  });
  
  // Allow Enter key to trigger manual search
  addressInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btnFindAddress')?.click();
    }
  });

  // Current Location button with GPS
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
        
        // Center map on current location
        if (map) {
          map.setView([lat, lng], 16);
          
          // Remove previous temp marker
          if (tempMarker) tempMarker.remove();
          
          // Add marker at current location
          tempMarker = window.L.marker([lat, lng], {
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
          if (reportLat) reportLat.value = lat.toFixed(6);
          if (reportLng) reportLng.value = lng.toFixed(6);
          
          showToast('Местоположението е намерено!', false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Грешка при намиране на местоположение';
        if (error.code === 1) errorMsg = 'Достъпът до местоположението е отказан';
        else if (error.code === 2) errorMsg = 'Местоположението не е налично';
        else if (error.code === 3) errorMsg = 'Времето за заявка изтече';
        showToast(errorMsg, true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });

  document.getElementById('btnSubmit')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const species = document.getElementById('species')?.value.trim();
    const status = statusMap[document.getElementById('status')?.value] || document.getElementById('status')?.value;
    const description = document.getElementById('description')?.value.trim();
    const contact = document.getElementById('contact')?.value.trim();
    const photo = document.getElementById('photo')?.files?.[0];
    const errEl = document.getElementById('formError');

    // Get Lat/Long from fields or use pending values
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

    const formData = new FormData();
    formData.append('lat', lat);
    formData.append('lng', lng);
    formData.append('species', species);
    formData.append('status', status);
    formData.append('description', description);
    formData.append('contact', contact);
    if (photo) formData.append('photo', photo);

    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('submit_failed');

      const submitBtn = document.getElementById('btnSubmit');
      submitBtn.style.background = '#10B981';
      submitBtn.textContent = 'Готово!';
      submitBtn.disabled = true;
      setTimeout(() => {
        submitBtn.style.background = '';
        submitBtn.textContent = 'Изпрати сигнал';
        submitBtn.disabled = false;
      }, 2000);

      showToast('Сигналът е изпратен успешно');
      document.getElementById('species').value = '';
      document.getElementById('status').value = 'ранено';
      document.getElementById('description').value = '';
      document.getElementById('contact').value = '';
      document.getElementById('photo').value = '';
      document.getElementById('manualAddress').value = '';
      document.getElementById('reportLat').value = '';
      document.getElementById('reportLng').value = '';
      if (tempMarker) tempMarker.remove();
      pendingLat = pendingLng = null;
      fetchMyIncidents();
      if (user.role === 'admin') fetchAllIncidents();
      if (adminController?.panel?.classList.contains('visible')) {
        adminController.loadIncidents(true);
      }
    } catch (err) {
      errEl.textContent = 'Грешка при изпращане. Опитайте отново.';
    }
  });

  async function fetchMyIncidents() {
    try {
      const res = await fetch(`${API_BASE}/incidents/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('load_failed');
      renderMyIncidents(await res.json());
    } catch (err) {
      console.error('Error fetching my incidents:', err);
    }
  }

  function renderMyIncidents(incidents) {
    const container = document.getElementById('myIncidentsList');
    if (!container) return;
    if (!incidents.length) {
      container.innerHTML = '<p>Все още нямате подадени сигнали</p>';
      return;
    }
    container.innerHTML = incidents
      .map(
        (inc) => `
      <div class="incidentItem">
        <strong>${inc.species || 'Непознато'}</strong>
        <span class="status-${inc.status}">${inc.status}</span>
        <small>${new Date(inc.created_at).toLocaleDateString('bg-BG')}</small>
        ${inc.resolved_at ? '<small style="color:#047857;font-weight:700;"> Разрешено</small>' : ''}
      </div>`
      )
      .join('');
  }

  async function fetchAllIncidents() {
    if (user.role !== 'admin' || !markersLayer) return;
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('load_failed');
      const incidents = await res.json();
      markersLayer.clearLayers();
      incidents.forEach((inc) => {
        const lat = Number(inc.lat);
        const lng = Number(inc.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const icon = window.L.divIcon({
          html: `<i class="fas fa-paw" style="color:${getStatusColor(inc.status)};font-size:20px;"></i>`,
          iconSize: [20, 20],
          className: 'incident-map-icon',
        });
        const marker = window.L.marker([lat, lng], { icon });
        marker.incidentId = inc.id;
        marker.bindPopup(`
            <div style="min-width:200px;color:#0F172A;font-weight:600;">
              <strong>${inc.species || 'Непознато'}</strong><br>
              Статус: ${inc.status}<br>
              <small>${new Date(inc.created_at).toLocaleDateString('bg-BG')}</small><br>
              <button type="button" class="map-popup-admin-btn" data-incident-id="${inc.id}">Детайли в админ</button>
            </div>`);
        marker.on('popupopen', (ev) => {
          const btn = ev.popup.getElement()?.querySelector('.map-popup-admin-btn');
          btn?.addEventListener('click', () => {
            if (typeof window.showAdminPanel === 'function') window.showAdminPanel();
            if (typeof window.showIncidentDetails === 'function') window.showIncidentDetails(inc.id);
          });
        });
        marker.addTo(markersLayer);
      });
    } catch (err) {
      console.error('Error fetching all incidents:', err);
    }
  }

  if (user.role === 'admin') {
    const adminBtn = document.getElementById('btnAdminPanel');
    if (adminBtn) adminBtn.style.display = 'inline-flex';
  }

  document.getElementById('btnLogout')?.addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.removeItem('roadguardian_token');
    localStorage.removeItem('roadguardian_user');
    window.location.href = 'index.html';
  });

  if (user.role === 'admin' && typeof initAdminPanel === 'function') {
    adminController = initAdminPanel({
      API_BASE,
      token,
      user,
      map: null,
      getMap: () => map,
      showToast,
      onFocusIncident: focusIncidentOnMap,
      onDataChanged: () => {
        fetchMyIncidents();
        clearHighlight();
        if (markersLayer) {
          markersLayer.clearLayers();
          fetchAllIncidents();
        }
      },
    });
    window.showAdminPanel = () => {
      adminController?.open();
      setTimeout(refreshMapSize, 300);
    };
    window.showIncidentDetails = (id) => adminController?.selectIncident(id);
  }

  setupLanguageToggle();

  function boot() {
    initMap();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50));
  } else {
    setTimeout(boot, 50);
  }
})();
