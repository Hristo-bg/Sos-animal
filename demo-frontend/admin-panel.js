/**
 * SOS Animal - Demo Admin Panel
 * Simplified admin panel with in-memory data
 */

function initAdminPanel(config) {
  const panel = document.getElementById('adminPanel');
  const btnCloseAdmin = document.getElementById('btnCloseAdmin');
  const adminIncidentsList = document.getElementById('adminIncidentsList');
  const btnAdminPanel = document.getElementById('btnAdminPanel');
  
  // Additional admin panel buttons
  const btnRefreshAdmin = document.getElementById('btnRefreshAdmin');
  const btnAdminExport = document.getElementById('btnAdminExport');
  const btnAdminBack = document.getElementById('btnAdminBack');
  const btnAdminCopyCoords = document.getElementById('btnAdminCopyCoords');
  const btnAdminOpenMaps = document.getElementById('btnAdminOpenMaps');
  const btnAdminUpdateStatus = document.getElementById('btnAdminUpdateStatus');
  const btnAdminSaveNotes = document.getElementById('btnAdminSaveNotes');
  const btnAdminDelete = document.getElementById('btnAdminDelete');
  
  // Window control buttons
  const btnMinimize = panel?.querySelector('.minimize');
  const btnMaximize = panel?.querySelector('.maximize');
  const btnClose = panel?.querySelector('.close');
  
  // Status colors from config or default
  const statusColors = config.statusColors || {
    'wounded': '#FBBF24',
    'deceased': '#EF4444',
    'handled': '#10B981'
  };
  
  let selectedId = null;
  let currentFilter = '';
  
  // Drag functionality
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  
  const dragHandle = panel?.querySelector('.admin-drag-handle');
  
  if (dragHandle) {
    dragHandle.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);
  }
  
  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    if (e.target === dragHandle || dragHandle.contains(e.target)) {
      isDragging = true;
      panel.classList.add('dragging');
    }
  }
  
  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    panel.classList.remove('dragging');
  }
  
  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
  }
  
  // Show admin panel
  function showAdminPanel() {
    panel.classList.add('visible');
    loadIncidents(true);
  }
  
  // Hide admin panel
  function hideAdminPanel() {
    panel.classList.remove('visible');
  }
  
  // Load incidents
  function loadIncidents(silent = false) {
    const incidents = config.incidents();
    
    // Apply filter if set
    let filteredIncidents = incidents;
    if (currentFilter) {
      filteredIncidents = incidents.filter(inc => inc.status === currentFilter);
    }
    
    if (!silent) {
      adminIncidentsList.innerHTML = '<div class="adminLoading"><i class="fas fa-spinner fa-spin"></i> Зареждане...</div>';
    }
    
    adminIncidentsList.innerHTML = filteredIncidents.map(inc => `
      <div class="adminIncidentCard ${selectedId === inc.id ? 'selected' : ''}" data-id="${inc.id}">
        <div class="adminIncidentHeader">
          <span class="adminIncidentId">#${inc.id}</span>
          <span class="adminIncidentStatus" style="background: ${statusColors[inc.status] || '#FBBF24'}">${inc.status}</span>
        </div>
        <div class="adminIncidentBody">
          <div class="adminIncidentSpecies">${inc.species || 'Непознато'}</div>
          <div class="adminIncidentMeta">
            <small>${new Date(inc.created_at).toLocaleDateString('bg-BG')}</small>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    adminIncidentsList.querySelectorAll('.adminIncidentCard').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        selectedId = id;
        loadIncidents(true);
        loadDetail(id);
        switchToView('detail');
      });
    });
  }
  
  // Switch between views (list/detail/stats)
  function switchToView(viewName) {
    document.querySelectorAll('.adminView').forEach(view => {
      view.classList.remove('active');
    });
    document.querySelectorAll('.adminTab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    const targetView = document.getElementById(`adminView${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
    const targetTab = document.querySelector(`.adminTab[data-tab="${viewName}"]`);
    
    if (targetView) targetView.classList.add('active');
    if (targetTab) targetTab.classList.add('active');
  }
  
  // Copy coordinates to clipboard
  function copyCoordinates(id) {
    const incidents = config.incidents();
    const incident = incidents.find(i => i.id === id);
    if (incident) {
      const coords = `${incident.lat.toFixed(6)}, ${incident.lng.toFixed(6)}`;
      navigator.clipboard.writeText(coords).then(() => {
        config.showToast('Координатите са копирани');
      });
    }
  }
  
  // Open in Google Maps
  function openInMaps(id) {
    const incidents = config.incidents();
    const incident = incidents.find(i => i.id === id);
    if (incident) {
      window.open(`https://www.google.com/maps?q=${incident.lat},${incident.lng}`, '_blank');
    }
  }
  
  // Export to CSV
  function exportToCSV() {
    const incidents = config.incidents();
    const headers = ['ID', 'Species', 'Status', 'Description', 'Contact', 'Latitude', 'Longitude', 'Created At', 'Resolved At', 'Admin Notes'];
    const rows = incidents.map(inc => [
      inc.id,
      inc.species,
      inc.status,
      inc.description,
      inc.contact,
      inc.lat,
      inc.lng,
      inc.created_at,
      inc.resolved_at,
      inc.admin_notes
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sos_animal_incidents_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    config.showToast('CSV файлът е изтеглен');
  }
  
  // Load statistics
  function loadStats() {
    const incidents = config.incidents();
    const statsBreakdown = document.getElementById('adminStatsBreakdown');
    
    if (!statsBreakdown) return;
    
    const total = incidents.length;
    const byStatus = incidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {});
    
    statsBreakdown.innerHTML = `
      <div class="adminDetailContent">
        <h3>Статистика</h3>
        <div class="adminDetailRow"><strong>Общо инциденти:</strong><span>${total}</span></div>
        <div class="adminDetailRow"><strong>Ранени:</strong><span style="color: ${statusColors.wounded}">${byStatus.wounded || 0}</span></div>
        <div class="adminDetailRow"><strong>Умрели:</strong><span style="color: ${statusColors.deceased}">${byStatus.deceased || 0}</span></div>
        <div class="adminDetailRow"><strong>Изчистени:</strong><span style="color: ${statusColors.handled}">${byStatus.handled || 0}</span></div>
      </div>
    `;
  }
  
  // Load incident detail
  function loadDetail(id) {
    const incidents = config.incidents();
    const incident = incidents.find(i => i.id === id);
    
    if (!incident) return;
    
    const detailContent = document.getElementById('adminDetailContent');
    if (detailContent) {
      detailContent.innerHTML = `
        <div class="adminDetailContent">
          <h3>Инцидент #${incident.id}</h3>
          <div class="adminDetailRow"><strong>Вид:</strong><span>${incident.species || 'Непознато'}</span></div>
          <div class="adminDetailRow"><strong>Статус:</strong><span>${incident.status}</span></div>
          <div class="adminDetailRow"><strong>Описание:</strong><span>${incident.description || 'Няма'}</span></div>
          <div class="adminDetailRow"><strong>Контакт:</strong><span>${incident.contact || 'Няма'}</span></div>
          <div class="adminDetailRow"><strong>Координати:</strong><span>${incident.lat.toFixed(6)}, ${incident.lng.toFixed(6)}</span></div>
          <div class="adminDetailRow"><strong>Създаден:</strong><span>${new Date(incident.created_at).toLocaleString('bg-BG')}</span></div>
          ${incident.admin_notes ? `<div class="adminDetailRow"><strong>Бележки:</strong><div class="adminNotesBox">${incident.admin_notes}</div></div>` : ''}
          
          <div style="margin-top: 1rem;">
            <label class="adminFieldLabel">Смени статус</label>
            <select id="statusSelect" class="adminSelect">
              <option value="wounded" ${incident.status === 'wounded' ? 'selected' : ''}>Ранено</option>
              <option value="deceased" ${incident.status === 'deceased' ? 'selected' : ''}>Умряло</option>
              <option value="handled" ${incident.status === 'handled' ? 'selected' : ''}>Изчистено</option>
            </select>
          </div>
          
          <div style="margin-top: 1rem;">
            <label class="adminFieldLabel">Бележки</label>
            <textarea id="adminNotes" class="adminTextarea" placeholder="Добави бележки...">${incident.admin_notes || ''}</textarea>
          </div>
        </div>
      `;
      
      // Add event listeners for detail view buttons
      btnAdminBack?.addEventListener('click', () => {
        selectedId = null;
        switchToView('list');
      });
      
      btnAdminCopyCoords?.addEventListener('click', () => {
        copyCoordinates(id);
      });
      
      btnAdminOpenMaps?.addEventListener('click', () => {
        openInMaps(id);
      });
      
      btnAdminUpdateStatus?.addEventListener('click', () => {
        const newStatus = document.getElementById('statusSelect').value;
        config.updateIncident(id, { status: newStatus });
        config.showToast('Статусът е актуализиран в демо режима.');
        loadIncidents(true);
        loadDetail(id);
      });
      
      btnAdminSaveNotes?.addEventListener('click', () => {
        const notes = document.getElementById('adminNotes').value;
        config.updateIncident(id, { admin_notes: notes });
        config.showToast('Бележките са запазени');
      });
      
      btnAdminDelete?.addEventListener('click', () => {
        if (confirm('Сигурни ли сте, че искате да изтриете този инцидент?')) {
          config.deleteIncident(id);
          config.showToast('Инцидентът е изтрит');
          selectedId = null;
          loadIncidents(true);
          switchToView('list');
        }
      });
    }
  }
  
  // Event listeners
  btnCloseAdmin?.addEventListener('click', hideAdminPanel);
  btnAdminPanel?.addEventListener('click', showAdminPanel);
  
  // Window control buttons
  btnClose?.addEventListener('click', hideAdminPanel);
  btnMinimize?.addEventListener('click', () => {
    panel.classList.toggle('minimized');
  });
  btnMaximize?.addEventListener('click', () => {
    const isMaximized = panel.classList.toggle('maximized');
    if (isMaximized) {
      // Reset drag transform when maximizing
      xOffset = 0;
      yOffset = 0;
      currentX = 0;
      currentY = 0;
      panel.style.transform = 'translate(-50%, -50%)';
    } else {
      // Restore original position when unmaximizing
      panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
  });
  
  // Refresh button
  btnRefreshAdmin?.addEventListener('click', () => {
    loadIncidents(false);
    config.showToast('Списъкът е опреснен');
  });
  
  // Export button (header)
  btnAdminExport?.addEventListener('click', exportToCSV);
  
  // Filter chips
  document.querySelectorAll('.adminChip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.adminChip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.status || '';
      loadIncidents(true);
    });
  });
  
  // Tab buttons
  document.querySelectorAll('.adminTab').forEach(tab => {
    tab.addEventListener('click', () => {
      const viewName = tab.dataset.tab;
      if (viewName === 'stats') {
        loadStats();
      }
      switchToView(viewName);
    });
  });
  
  // Export CSV button (footer)
  document.getElementById('btnExportCSV')?.addEventListener('click', exportToCSV);
  
  // Make functions available globally
  window.showAdminPanel = showAdminPanel;
  window.exportToCSV = exportToCSV;
  
  // Return controller
  return {
    panel,
    loadIncidents,
    loadDetail,
    showAdminPanel,
    hideAdminPanel
  };
}
