SOS Animal - Quick Start
==========================================

Two entry points, for two different audiences:

1) start.bat - end users / the packaged desktop app
   - Double-click start.bat
   - Wait for the SOS Animal desktop window to open
   - Close the app window to stop its local servers
   - Uses the already-built public/admin-build bundle (no live reload)

2) dev.bat - developers working on the source
   - Double-click dev.bat (or run `npm run dev` from the project root yourself)
   - Installs dependencies automatically on first run
   - Starts all three dev processes together: backend API, the admin desk
     (Vite, with hot reload), and the public site
   - Press Ctrl+C in that window to stop all three

Access URLs:
- Admin desk (dev, hot reload): http://localhost:5173
- Public site / packaged admin: http://localhost:7777 (admin at /admin.html)
- API: http://localhost:3333/api

Default Admin Login:
- Email: admin@puten-pazitel.local
- Password: admin123

Requirements:
- Node.js (only when running from the source project, not for the installed .exe)
- No MySQL or XAMPP required - the backend uses an embedded, file-based database

That's it! Everything else is handled automatically.
