@echo off
powershell -Command "(Get-Content app.js) -replace 'async function apiCall(method, endpoint, body = null, requireAuth = false) {', 'const API_BASE = ''http://localhost:3333/api'';`n`n`n  async function apiCall(method, endpoint, body = null, requireAuth = false) {'"
