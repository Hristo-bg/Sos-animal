// RoadGuardian Mock Data Generator
// Generates ~100 incidents for heatmap testing

const fs = require('fs');
const path = require('path');

// Bulgaria bounds
const BULGARIA_BOUNDS = {
  north: 44.5,
  south: 41.0,
  east: 29.0,
  west: 22.0
};

const SPECIES_TYPES = ['mammal', 'reptile', 'bird', 'pet', 'other'];
const SPECIES_NAMES = {
  mammal: ['Лисица', 'Елен', 'Сърна', 'Дива свиня', 'Заек', 'Костенурка', 'Вълк', 'Медвед', 'Риса', 'Нутрия'],
  reptile: ['Костенурка', 'Гущер', 'Змия', 'Игуана'],
  bird: ['Сокол', 'Орел', 'Сови', 'Гълъб', 'Врабчета', 'Щъркел', 'Лебед', 'Патица', 'Фламинго'],
  pet: ['Куче', 'Котарак', 'Кон', 'Овца', 'Коза', 'Папагал'],
  other: ['Неизвестен']
};

const STATUSES = ['unclaimed', 'claimed', 'handled', 'verified'];
const SEVERITIES = ['low', 'medium', 'high', 'emergency'];
const URGENCIES = ['dead', 'wounded', 'trapped'];

// Generate random coordinate within Bulgaria bounds
function randomCoordinate() {
  const lat = BULGARIA_BOUNDS.south + Math.random() * (BULGARIA_BOUNDS.north - BULGARIA_BOUNDS.south);
  const lng = BULGARIA_BOUNDS.west + Math.random() * (BULGARIA_BOUNDS.east - BULGARIA_BOUNDS.west);
  return { latitude: lat, longitude: lng };
}

// Generate random timestamp within last 30 days
function randomTimestamp() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  
  // Add random hours and minutes
  timestamp.setHours(Math.floor(Math.random() * 24));
  timestamp.setMinutes(Math.floor(Math.random() * 60));
  
  return timestamp.toISOString();
}

// Generate mock incident
function generateIncident(index) {
  const speciesType = SPECIES_TYPES[Math.floor(Math.random() * SPECIES_TYPES.length)];
  const speciesNames = SPECIES_NAMES[speciesType];
  const speciesName = speciesNames[Math.floor(Math.random() * speciesNames.length)];
  
  const coordinates = randomCoordinate();
  const timestamp = randomTimestamp();
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
  const urgency = URGENCIES[Math.floor(Math.random() * URGENCIES.length)];
  
  // Create GeoPoint like structure
  const geoPoint = new firebase.firestore.GeoPoint(coordinates.latitude, coordinates.longitude);
  
  return {
    id: `mock_incident_${index}`,
    coordinates: geoPoint,
    timestamp: new Date(timestamp),
    reporterId: `mock_reporter_${Math.floor(Math.random() * 10) + 1}`,
    handlerId: status !== 'unclaimed' ? `mock_handler_${Math.floor(Math.random() * 5) + 1}` : null,
    status: status,
    severity: severity,
    urgency: urgency,
    speciesType: speciesType,
    photoUrl: Math.random() > 0.7 ? `https://picsum.photos/seed/incident${index}/400/300.jpg` : null,
    photoPath: Math.random() > 0.7 ? `incidents/${index}/photo.jpg` : null,
    handlingNotes: status === 'handled' || status === 'verified' ? 
      ['Животното е пренесено в безопасност', 'Осигурена е ветеринарна помощ', 'Освободено е в природата'][Math.floor(Math.random() * 3)] : 
      null,
    bearing: Math.random() * 360,
    speedMps: Math.random() * 20
  };
}

// Generate Firestore batch data
function generateFirestoreBatch(incidents) {
  const batch = [];
  
  incidents.forEach(incident => {
    // Convert to Firestore format
    const firestoreDoc = {
      ...incident,
      timestamp: firebase.firestore.Timestamp.fromDate(incident.timestamp),
      resolvedAt: incident.resolvedAt ? firebase.firestore.Timestamp.fromDate(incident.resolvedAt) : null
    };
    
    batch.push({
      __name__: {
        projectId: 'roadguardian-demo',
        databaseId: '(default)',
        documentPath: `incidents/${incident.id}`
      },
      fields: convertToFirestoreFields(firestoreDoc)
    });
  });
  
  return batch;
}

// Convert JavaScript object to Firestore fields format
function convertToFirestoreFields(obj) {
  const fields = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (value && value.latitude !== undefined && value.longitude !== undefined) {
      // GeoPoint
      fields[key] = {
        geoPointValue: {
          latitude: value.latitude,
          longitude: value.longitude
        }
      };
    } else if (value && value.seconds !== undefined) {
      // Firestore Timestamp
      fields[key] = {
        timestampValue: value.toDate().toISOString()
      };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  });
  
  return fields;
}

// Main generation function
function generateMockData(count = 100) {
  console.log(`Generating ${count} mock incidents...`);
  
  const incidents = [];
  for (let i = 1; i <= count; i++) {
    incidents.push(generateIncident(i));
  }
  
  // Save as JSON for development
  const jsonPath = path.join(__dirname, '..', 'data', 'mock_incidents.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(incidents, null, 2));
  
  // Save as Firestore backup format
  const batchData = generateFirestoreBatch(incidents);
  const batchPath = path.join(__dirname, '..', 'data', 'firestore_batch.json');
  fs.writeFileSync(batchPath, JSON.stringify(batchData, null, 2));
  
  // Generate statistics
  const stats = {
    total: incidents.length,
    byStatus: {},
    bySeverity: {},
    bySpecies: {},
    byUrgency: {}
  };
  
  incidents.forEach(incident => {
    stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
    stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
    stats.bySpecies[incident.speciesType] = (stats.bySpecies[incident.speciesType] || 0) + 1;
    stats.byUrgency[incident.urgency] = (stats.byUrgency[incident.urgency] || 0) + 1;
  });
  
  const statsPath = path.join(__dirname, '..', 'data', 'mock_stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  
  console.log(`✅ Generated ${count} mock incidents`);
  console.log(`📊 Statistics saved to mock_stats.json`);
  console.log(`📄 JSON data saved to mock_incidents.json`);
  console.log(`🔥 Firestore batch saved to firestore_batch.json`);
  
  return incidents;
}

// Run if called directly
if (require.main === module) {
  // Mock Firebase for data generation
  global.firebase = {
    firestore: {
      GeoPoint: function(lat, lng) {
        return { latitude: lat, longitude: lng };
      },
      Timestamp: {
        fromDate: function(date) {
          return { seconds: Math.floor(date.getTime() / 1000), nanos: 0, toDate: () => date };
        }
      }
    }
  };
  
  const count = parseInt(process.argv[2]) || 100;
  generateMockData(count);
}

module.exports = { generateMockData, randomCoordinate, randomTimestamp };
