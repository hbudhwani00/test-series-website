# Quick Start Script for JEE & NEET Test Series
# Run this script to set up and start the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  JEE & NEET Test Series - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongoService -and $mongoService.Status -ne 'Running') {
    Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
    Start-Service MongoDB
}

# Install backend dependencies
if (!(Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "Backend dependencies already installed." -ForegroundColor Green
}

# Install frontend dependencies
if (!(Test-Path "client\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
} else {
    Write-Host "Frontend dependencies already installed." -ForegroundColor Green
}

# Check for .env file
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Please edit the .env file with your configuration!" -ForegroundColor Yellow
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting the application..." -ForegroundColor Yellow
Write-Host "Backend will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend will run on: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm run dev-full
