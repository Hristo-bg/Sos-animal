$body = @{
    email = "admin@puten-pazitel.local"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5050/api/login" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 3
