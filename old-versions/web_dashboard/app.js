// RoadGuardian V2 Dashboard App
class RoadGuardianDashboard {
  constructor() {
    this.map = null;
    this.firestore = null;
    this.incidents = [];
    this.heatmapLayer = null;
    this.markers = new Map();
    this.selectedIncident = null;
    
    this.init();
  }

  async init() {
    try {
      this.checkConfig();
      await this.initializeServices();
      this.setupEventListeners();
      this.startRealtimeUpdates();
    } catch (error) {
      this.showApiError(error);
    }
  }

  checkConfig() {
    if (!window.ROADGUARDIAN_CONFIG) {
      throw new Error('Configuration not loaded. Ensure config.js exists and is loaded before app.js');
    }
    
    const config = window.ROADGUARDIAN_CONFIG;
    if (!config.googleMapsApiKey || config.googleMapsApiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      throw new Error('Google Maps API key not configured');
    }
    
    if (!config.firebase || !config.firebase.projectId) {
      throw new Error('Firebase configuration not complete');
    }
  }

  async initializeServices() {
    // Initialize Google Maps
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API failed to load. Check API key and network');
    }
    
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 42.7339, lng: 25.4858 }, // Bulgaria
      zoom: 7,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
        {
          featureType: "administrative",
          elementType: "geometry",
          stylers: [{ color: "#2c2c2c" }]
        }
      ]
    });

    // Initialize Firebase
    const config = window.ROADGUARDIAN_CONFIG.firebase;
    firebase.initializeApp(config);
    this.firestore = firebase.firestore();

    // Update status indicators
    this.updateStatus('maps', 'ok', 'Loaded');
    this.updateStatus('firebase', 'ok', 'Initialized');
    this.updateStatus('firestore', 'ok', 'Connected');
  }

  setupEventListeners() {
    // Heatmap toggle
    document.getElementById('heatmapToggle').addEventListener('click', () => {
      this.toggleHeatmap();
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.showExportMenu();
    });

    // Filters
    document.getElementById('ageFilter').addEventListener('change', () => {
      this.applyFilters();
    });
    
    document.getElementById('statusFilter').addEventListener('change', () => {
      this.applyFilters();
    });
  }

  startRealtimeUpdates() {
    this.firestore.collection('incidents')
      .onSnapshot((snapshot) => {
        this.incidents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.updateIncidentsList();
        this.updateMapMarkers();
      }, (error) => {
        console.error('Firestore subscription error:', error);
        this.updateStatus('firestore', 'error', this.getFirestoreErrorMessage(error));
      });
  }

  updateIncidentsList() {
    const container = document.getElementById('incidentsList');
    const filtered = this.getFilteredIncidents();
    
    container.innerHTML = filtered.map(incident => `
      <div class="incident-card ${this.selectedIncident?.id === incident.id ? 'selected' : ''}" 
           onclick="dashboard.selectIncident('${incident.id}')">
        <div class="flex justify-between items-start mb-2">
          <span class="font-medium text-white">${incident.speciesType || 'Unknown'}</span>
          <span class="incident-status status-${incident.status}">${incident.status}</span>
        </div>
        <div class="text-xs text-gray-400">
          ${new Date(incident.timestamp?.toDate?.() || incident.timestamp).toLocaleString()}
        </div>
        <div class="flex gap-1 mt-2">
          <span class="severity-${incident.severity}">${incident.severity}</span>
          <span class="urgency-${incident.urgency}">${incident.urgency}</span>
        </div>
      </div>
    `).join('');
  }

  updateMapMarkers() {
    // Clear existing markers
    this.markers.forEach(marker => marker.setMap(null));
    this.markers.clear();

    const filtered = this.getFilteredIncidents();
    
    filtered.forEach(incident => {
      const marker = new google.maps.Marker({
        position: incident.coordinates,
        map: this.map,
        title: incident.speciesType,
        icon: this.getMarkerIcon(incident)
      });

      marker.addListener('click', () => {
        this.selectIncident(incident.id);
      });

      this.markers.set(incident.id, marker);
    });
  }

  getMarkerIcon(incident) {
    const colors = {
      unclaimed: '#FCD34D',
      claimed: '#60A5FA',
      handled: '#34D399',
      verified: '#A78BFA'
    };

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: colors[incident.status] || '#6B7280',
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8
    };
  }

  selectIncident(id) {
    this.selectedIncident = this.incidents.find(i => i.id === id);
    this.updateIncidentsList();
    this.showIncidentDetails();
    
    // Center map on selected incident
    if (this.selectedIncident?.coordinates) {
      this.map.panTo(this.selectedIncident.coordinates);
    }
  }

  showIncidentDetails() {
    if (!this.selectedIncident) return;

    const modal = document.getElementById('incidentModal');
    const details = document.getElementById('incidentDetails');
    
    details.innerHTML = `
      <div class="space-y-4">
        <div>
          <label class="text-sm text-gray-400">Species Type</label>
          <p class="text-white font-medium">${this.selectedIncident.speciesType || 'Unknown'}</p>
        </div>
        <div>
          <label class="text-sm text-gray-400">Status</label>
          <p><span class="incident-status status-${this.selectedIncident.status}">${this.selectedIncident.status}</span></p>
        </div>
        <div>
          <label class="text-sm text-gray-400">Severity</label>
          <p><span class="severity-${this.selectedIncident.severity}">${this.selectedIncident.severity}</span></p>
        </div>
        <div>
          <label class="text-sm text-gray-400">Urgency</label>
          <p><span class="urgency-${this.selectedIncident.urgency}">${this.selectedIncident.urgency}</span></p>
        </div>
        <div>
          <label class="text-sm text-gray-400">Location</label>
          <p class="text-white font-mono text-sm">
            ${this.selectedIncident.coordinates?.lat.toFixed(6)}, ${this.selectedIncident.coordinates?.lng.toFixed(6)}
          </p>
        </div>
        <div>
          <label class="text-sm text-gray-400">Reported</label>
          <p class="text-white">${new Date(this.selectedIncident.timestamp?.toDate?.() || this.selectedIncident.timestamp).toLocaleString()}</p>
        </div>
        ${this.selectedIncident.photoUrl ? `
          <div>
            <label class="text-sm text-gray-400">Photo</label>
            <img src="${this.selectedIncident.photoUrl}" alt="Incident photo" class="w-full rounded-lg">
          </div>
        ` : ''}
        ${this.selectedIncident.handlingNotes ? `
          <div>
            <label class="text-sm text-gray-400">Handling Notes</label>
            <p class="text-white">${this.selectedIncident.handlingNotes}</p>
          </div>
        ` : ''}
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
  }

  toggleHeatmap() {
    const btn = document.getElementById('heatmapToggle');
    
    if (this.heatmapLayer) {
      this.heatmapLayer.setMap(null);
      this.heatmapLayer = null;
      btn.classList.remove('heatmap-active');
      btn.textContent = 'Heatmap';
    } else {
      const heatmapData = this.incidents
        .filter(incident => incident.coordinates)
        .map(incident => ({
          location: incident.coordinates,
          weight: this.getHeatmapWeight(incident)
        }));

      this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        radius: 20,
        opacity: 0.6
      });
      
      this.heatmapLayer.setMap(this.map);
      btn.classList.add('heatmap-active');
      btn.textContent = 'Hide Heatmap';
    }
  }

  getHeatmapWeight(incident) {
    const severityWeight = { low: 1, medium: 2, high: 3, emergency: 4 };
    return severityWeight[incident.severity] || 1;
  }

  showExportMenu() {
    // Simple export implementation
    const filtered = this.getFilteredIncidents();
    const csv = this.convertToCSV(filtered);
    this.downloadFile('incidents.csv', csv, 'text/csv');
  }

  convertToCSV(incidents) {
    const headers = ['ID', 'Species Type', 'Status', 'Severity', 'Urgency', 'Latitude', 'Longitude', 'Timestamp'];
    const rows = incidents.map(i => [
      i.id,
      i.speciesType || '',
      i.status,
      i.severity,
      i.urgency,
      i.coordinates?.lat || '',
      i.coordinates?.lng || '',
      new Date(i.timestamp?.toDate?.() || i.timestamp).toISOString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  getFilteredIncidents() {
    let filtered = [...this.incidents];
    
    // Age filter
    const ageFilter = document.getElementById('ageFilter').value;
    if (ageFilter) {
      const cutoff = new Date();
      if (ageFilter === '2h') cutoff.setHours(cutoff.getHours() - 2);
      else if (ageFilter === '24h') cutoff.setDate(cutoff.getDate() - 1);
      else if (ageFilter === '7d') cutoff.setDate(cutoff.getDate() - 7);
      
      filtered = filtered.filter(i => {
        const timestamp = i.timestamp?.toDate?.() || new Date(i.timestamp);
        return timestamp >= cutoff;
      });
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter').value;
    if (statusFilter) {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    
    return filtered;
  }

  applyFilters() {
    this.updateIncidentsList();
    this.updateMapMarkers();
  }

  updateStatus(service, status, message) {
    const element = document.getElementById(`${service}Status`);
    if (element) {
      element.className = `font-mono status-${status}`;
      element.textContent = message;
    }
  }

  getFirestoreErrorMessage(error) {
    if (error.code === 'permission-denied') return 'Permission denied';
    if (error.code === 'unavailable') return 'Service unavailable';
    return error.message || 'Unknown error';
  }

  showApiError(error) {
    const banner = document.getElementById('apiStatusBanner');
    const message = document.getElementById('apiStatusMessage');
    
    message.textContent = `Error: ${error.message}`;
    banner.classList.remove('hidden');
    
    console.error('RoadGuardian initialization error:', error);
  }
}

// Global functions
window.closeIncidentModal = function() {
  const modal = document.getElementById('incidentModal');
  modal.classList.add('modal-leave');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('modal-enter', 'modal-leave');
  }, 200);
};

window.dismissBanner = function() {
  document.getElementById('apiStatusBanner').classList.add('hidden');
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new RoadGuardianDashboard();
});
