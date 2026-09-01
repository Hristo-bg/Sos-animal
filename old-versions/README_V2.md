# RoadGuardian V2.0 — Professional GIS & Rescue Suite

An advanced wildlife incident reporting and management system with real-time maps, AI-powered image classification, and role-based incident handling.

## 🚀 Quick Start

### Web Dashboard
1. Configure API keys:
   ```bash
   cp web_dashboard/config.example.js web_dashboard/config.js
   # Edit config.js with your actual API keys
   ```

2. Serve the dashboard:
   ```bash
   cd web_dashboard
   python -m http.server 8080
   # or use any static server
   ```

3. Open `http://localhost:8080`

### Mobile App (Flutter)
```bash
cd lib  # Flutter project directory
flutter pub get
flutter run
```

### Backend Services
```bash
cd backend
npm install
npm start
```

## 📋 Features

### Web Dashboard V2
- **Split-screen layout**: Map on left, incident list on right
- **Real-time updates**: Live Firebase Firestore integration
- **Advanced filtering**: By age, status, severity, urgency
- **Heatmap visualization**: Google Maps heatmap layer
- **Export functionality**: CSV and GeoJSON export
- **API Status widget**: Real-time service health monitoring
- **Incident details modal**: Comprehensive incident information

### Mobile Reporter
- **AI Image Classification**: TensorFlow Lite model for species identification
- **Offline support**: Queue incidents when offline
- **GPS telemetry**: Capture speed and bearing
- **Voice notes**: Audio recording for incident details
- **Push notifications**: FCM integration for real-time updates

### Backend Services
- **Firebase Integration**: Firestore for data, Storage for photos
- **Role-based access control**: Admin, Organization, Reporter roles
- **Claim-once enforcement**: Prevents duplicate incident handling
- **RESTful APIs**: Comprehensive incident management endpoints

## 🏗️ Architecture

### Data Model (V2)
```
Incident {
  id: string
  coordinates: GeoPoint
  timestamp: Timestamp
  reporterId: string
  handlerId?: string
  status: unclaimed | claimed | handled | verified | archived
  severity: low | medium | high | emergency
  urgency: dead | wounded | trapped
  speciesType: mammal | reptile | bird | pet | other
  photoUrl?: string
  photoPath?: string
  handlingNotes?: string
  bearing?: number (degrees)
  speedMps?: number
}
```

### Security Rules
- **Admin**: Full access (create, read, update, delete)
- **Organization**: Can claim unclaimed incidents, update their claimed incidents
- **Reporter**: Create incidents, read their own incidents
- **Claim-once**: Only one organization can claim an incident

### Services
- **NotificationService**: FCM token management and topic subscription
- **AIImageService**: TensorFlow Lite image classification
- **MockDataGenerator**: Development data generation

## 🔧 Configuration

### Google Maps API
Enable these APIs in Google Cloud Console:
- Maps JavaScript API
- Directions API (for route optimization)
- Places API (optional, for search)

### Firebase
1. Create a new Firebase project
2. Enable Firestore and Storage
3. Configure security rules (see `firebase/` directory)
4. Add web app configuration to `config.js`

### Environment Variables
```bash
# Backend
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=roadguardian

# Firebase (config.js)
GOOGLE_MAPS_API_KEY=your_key_here
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id
```

## 📊 Testing

### Mock Data Generation
Generate ~100 incidents for testing:
```bash
node scripts/generate_mock_data.js 100
```

This creates:
- `data/mock_incidents.json` - Raw incident data
- `data/firestore_batch.json` - Firestore import format
- `data/mock_stats.json` - Generation statistics

### Heatmap Testing
1. Generate mock data
2. Load dashboard
3. Toggle heatmap view
4. Verify incident density visualization

## 🔐 Security

### API Keys
- Never commit `config.js` - it's in `.gitignore`
- Use `config.example.js` as template
- Rotate keys regularly

### Firebase Rules
- Enforce claim-once pattern
- Validate incident data structure
- Restrict photo access by ownership

### Data Privacy
- GDPR compliance in registration flow
- Optional phone number collection
- Data retention policies

## 📱 Mobile Development

### Required Dependencies
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.24.2
  firebase_firestore: ^4.13.6
  firebase_storage: ^11.5.6
  firebase_messaging: ^14.7.10
  google_maps_flutter: ^2.5.0
  tflite_flutter: ^0.10.4
  image: ^4.1.1
```

### AI Model Setup
1. Download MobileNetV2 model:
   ```bash
   # Add to assets/models/
   wget https://storage.googleapis.com/download.tensorflow.org/models/tflite/mobilenet_v2_1.0_224.tflite
   ```

2. Add labels file:
   ```bash
   # assets/models/labels.txt
   # Download ImageNet labels
   ```

3. Update `pubspec.yaml`:
   ```yaml
   flutter:
     assets:
       - assets/models/
   ```

## 🚀 Deployment

### Web Dashboard
- Deploy to any static hosting (Vercel, Netlify, Firebase Hosting)
- Ensure HTTPS for secure API calls
- Configure CORS for Firebase

### Mobile App
- Build APK/IPA for distribution
- Configure app signing keys
- Submit to app stores

### Backend
- Deploy to Node.js hosting platform
- Configure MySQL database
- Set up SSL certificates

## 📈 Monitoring

### API Status Widget
The dashboard includes real-time monitoring of:
- Google Maps API status
- Firebase initialization
- Firestore connectivity
- Common error detection

### Error Handling
- Graceful degradation when services are unavailable
- User-friendly error messages
- Automatic retry mechanisms

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🆘 Support

- Create GitHub issues for bugs
- Check documentation in `/docs`
- Contact maintainers for support requests

---

**RoadGuardian V2** - Protecting wildlife through technology 🦌🐦🐢
