$content = Get-Content "app.js" -Raw
$updatedContent = $content -replace "// API wrappers", "const API_BASE = 'http://localhost:3333/api';`n`n  // API wrappers"
Set-Content "app.js" $updatedContent
Write-Host "API_BASE definition added successfully"
