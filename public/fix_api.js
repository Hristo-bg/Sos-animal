const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const updatedContent = content.replace('async function apiCall(method, endpoint, body = null, requireAuth = false) {', `const API_BASE = 'http://localhost:3333/api';\n\n  async function apiCall(method, endpoint, body = null, requireAuth = false) {`);
fs.writeFileSync('app.js', updatedContent, 'utf8');
console.log('API_BASE definition added');
