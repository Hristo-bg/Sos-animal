const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const updatedContent = content.replace('// API wrappers', `const API_BASE = 'http://localhost:3333/api';\n\n  // API wrappers`);
fs.writeFileSync('app.js', updatedContent, 'utf8');
console.log('API_BASE definition added successfully');
