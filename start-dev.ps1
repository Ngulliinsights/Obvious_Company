# PowerShell script to start The Obvious Company development server

Write-Host "🚀 Starting The Obvious Company development server..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm run setup
}

# Start development server
Write-Host "🌐 Starting development server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev