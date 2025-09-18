@echo off
echo Starting The Obvious Company development server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm run setup
)

REM Start development server
echo Starting development server...
npm run dev

pause