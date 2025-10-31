# Create Admin Account Script
# Run this after starting the server to create an admin account

$baseUrl = "http://localhost:5000"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Create Admin Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get admin details
$name = Read-Host "Enter admin name (default: Admin)"
if ([string]::IsNullOrWhiteSpace($name)) { $name = "Admin" }

$phone = Read-Host "Enter admin phone number (default: 9999999999)"
if ([string]::IsNullOrWhiteSpace($phone)) { $phone = "9999999999" }

$password = Read-Host "Enter admin password (default: admin123)"
if ([string]::IsNullOrWhiteSpace($password)) { $password = "admin123" }

# Create request body
$body = @{
    name = $name
    phone = $phone
    password = $password
    secretKey = "CREATE_ADMIN_SECRET_2024"
} | ConvertTo-Json

Write-Host ""
Write-Host "Creating admin account..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/create-admin" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Admin Account Created Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Admin Login Credentials:" -ForegroundColor Cyan
    Write-Host "Phone: $phone" -ForegroundColor White
    Write-Host "Password: $password" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now login at: http://localhost:3000/login" -ForegroundColor Yellow
} catch {
    Write-Host ""
    Write-Host "Error creating admin account:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host ""
        Write-Host "Note: Admin might already exist. Try logging in with your credentials." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Make sure the server is running on $baseUrl" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
