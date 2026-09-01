# SOS Animal - Static Frontend (Netlify Ready)

## 🚀 Deployment Instructions

### Quick Deploy to Netlify
1. **Drag and Drop Method:**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag the entire contents of this `static-frontend` folder into the upload area
   - Netlify will automatically deploy your site in seconds
   - Your site will be live at a random URL like `https://random-name-12345.netlify.app`

2. **Manual Deploy via Netlify Dashboard:**
   - Log in to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Deploy manually"
   - Drag and drop the `static-frontend` folder
   - Wait for deployment to complete

### Local Testing
```bash
# Using Python
cd static-frontend
python -m http.server 8000
# Open http://localhost:8000

# Using Node.js
cd static-frontend
npx http-server -p 8000
# Open http://localhost:8000
```

---

## 🎯 Features

### What Works in Static Mode
- ✅ **Map with OpenStreetMap tiles** - Detailed road visibility
- ✅ **Address search with autocomplete** - Nominatim API (Bulgaria only)
- ✅ **GPS location detection** - Browser geolocation
- ✅ **Simulated authentication** - Register/Login with localStorage
- ✅ **Incident reporting** - Creates incidents in localStorage
- ✅ **Admin panel** - Full CRUD operations on incidents
- ✅ **Sample data** - 6 pre-loaded Bulgarian incidents (Sofia, Plovdiv, Varna)
- ✅ **Multilingual support** - Bulgarian/English toggle
- ✅ **Responsive design** - Mobile-friendly
- ✅ **Premium V8 UI** - Mint/Cream/Forest color scheme

### Data Storage
- **localStorage-based database** - All data stored in browser
- **No backend required** - Works completely offline
- **Sample incidents** - Auto-loaded on first visit
- **User accounts** - Simulated authentication with localStorage

---

## 🔐 Default Login Credentials

### Admin Account
- **Email:** `admin@sosanimal.bg`
- **Password:** `admin123`
- **Role:** Admin (full access to all features)

### Regular User
- **Email:** `user@sosanimal.bg`
- **Password:** `user123`
- **Role:** User (can report incidents)

### Register New Account
- Click "Вход" (Login) button
- Toggle to "Register" mode
- Enter email and password
- Account created instantly in localStorage

---

## 🗺️ Map Features

### Address Search
- Type any Bulgarian address
- Autocomplete shows 5 suggestions
- Click to fly to location with SOS Paw icon
- Coordinates auto-filled in form

### GPS Location
- Click the 🎯 crosshairs button
- Browser requests GPS permission
- Map flies to your current location
- SOS Paw icon placed automatically

### Map Tiles
- OpenStreetMap standard tiles
- High contrast road visibility
- No grayscale filters
- Bulgaria-focused bounds

---

## 📂 File Structure

```
static-frontend/
├── index.html              # Landing page
├── dashboard.html          # Dashboard with map
├── styles.css              # Main stylesheet
├── admin-panel.css         # Admin panel styles
├── app.js                  # Landing page logic
├── dashboard.js            # Dashboard logic
├── admin-panel.js          # Admin panel logic
├── storage-service.js      # localStorage CRUD operations
├── api-compat.js           # API compatibility layer
├── icon.png                # App icon
└── README.md               # This file
```

---

## 🔧 Technical Details

### API Compatibility Layer
The `api-compat.js` file intercepts all fetch calls and redirects them to localStorage operations:
- `GET /api/incidents` → Reads from localStorage
- `POST /api/incidents` → Appends to localStorage
- `PATCH /api/incidents/:id` → Updates in localStorage
- `DELETE /api/incidents/:id` → Removes from localStorage
- `POST /api/auth/login` → Validates against localStorage users
- `POST /api/auth/register` → Creates user in localStorage

### Storage Keys
- `sos_animal_incidents` - Array of incident objects
- `sos_animal_users` - Array of user objects
- `roadguardian_token` - Authentication token
- `roadguardian_user` - Current user object
- `current_user_email` - Current user email

### Sample Data
Pre-loaded incidents include:
1. Sofia - Wounded fox
2. Plovdiv - Deceased deer
3. Varna - Wounded rabbit
4. Sofia - Handled cat
5. Pernik - Wounded deer
6. Varna - Deceased pony

---

## 🎨 UI Features

### Color Scheme (V8)
- **Forest:** #1A2A2A (Dark green for text/headers)
- **Mint:** #d5f4e6 (Light green background)
- **Cream:** #FFFFFF (White surfaces)
- **Aqua:** #80ced6 (Accent color)
- **Lime:** #ADFF2F (Markers/highlights)

### Typography
- **Font:** Montserrat (Google Fonts)
- **Full Cyrillic support**
- **Bold weights for headings**
- **High contrast for readability**

---

## 🌐 External APIs Used

### Nominatim (OpenStreetMap)
- **Purpose:** Address geocoding and autocomplete
- **Rate Limit:** 1 request per second
- **Country:** Bulgaria only (`countrycodes=bg`)
- **Language:** Bulgarian (`accept-language=bg`)
- **No API key required**

### Leaflet Maps
- **Tile Provider:** OpenStreetMap
- **URL:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **No API key required**

---

## 📱 Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Required Features
- Geolocation API (for GPS)
- LocalStorage (for data persistence)
- ES6+ JavaScript support

---

## 🚫 Limitations

### Static Mode Constraints
- ❌ No real backend database
- ❌ Data stored in browser only (not shared between devices)
- ❌ Clearing browser data deletes all incidents
- ❌ No real photo uploads (simulated with placeholder)
- ❌ No email notifications
- ❌ No real-time updates between users

### Photo Uploads
- Photos are simulated (not actually stored)
- Incident shows "Wildlife Evidence" placeholder
- Avoids localStorage size limits
- Full photo upload requires backend

---

## 🔄 Data Persistence

### localStorage Limits
- **Storage limit:** ~5-10MB per domain
- **Incident data:** Text only (no large files)
- **Automatic cleanup:** Browser may clear data if storage is full
- **Export:** Use Admin Panel → Export CSV to backup data

### Backup Your Data
1. Open Admin Panel
2. Click "Експорт CSV" button
3. Download CSV file with all incidents
4. Keep CSV as backup

---

## 🎯 Deployment Checklist

Before deploying to Netlify:
- ✅ All paths are relative (`./` instead of `/`)
- ✅ No localhost or port references
- ✅ API_BASE set to `/api` (intercepted by api-compat.js)
- ✅ storage-service.js loaded before other scripts
- ✅ api-compat.js loaded before app.js/dashboard.js
- ✅ Sample data auto-loads on first visit
- ✅ Default admin account created

---

## 📞 Support

### Issues?
- Check browser console for errors
- Ensure localStorage is enabled
- Try clearing cache and reloading
- Verify all files are uploaded to Netlify

### Reset Data
To clear all data and start fresh:
```javascript
// Open browser console and run:
localStorage.clear();
location.reload();
```

---

## 📄 License

This project is open source. Feel free to modify and deploy for your own wildlife protection initiatives.

---

**Made with ❤️ for wildlife protection in Bulgaria**

