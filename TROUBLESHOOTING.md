# Troubleshooting Guide - The Obvious Company Website

## Quick Start (Recommended)

### Option 1: Use the Startup Script
```bash
node start-server.js
```

### Option 2: Use VS Code Debugger
1. Press `F5` or go to Run & Debug
2. Select "Launch Website with Server"
3. Server will start and you can browse to `http://localhost:3000`

### Option 3: Manual Setup
```bash
cd website/server
npm install
npm run dev
```

## Common Issues & Solutions

### 1. "Oops! Something went wrong" Popup

**Cause**: Opening HTML files directly instead of running the server

**Solution**: 
- ❌ Don't open `website/index.html` directly in browser
- ✅ Start the server and go to `http://localhost:3000`

### 2. Analytics/Form Errors

**Symptoms**: 
- Console errors about `/api/analytics/track`
- Contact forms not working
- Network errors

**Solution**: Make sure the server is running properly
```bash
# Check if server is running
curl http://localhost:3000/api/health

# If not running, start it
node start-server.js
```

### 3. Rate Limiting Issues

**Symptoms**: "Too many requests" errors

**Solution**: Rate limits have been optimized for development:
- General requests: 5000 per 15 minutes
- Forms: 50 per 15 minutes  
- API calls: 500 per 15 minutes

### 4. Missing Dependencies

**Symptoms**: Module not found errors

**Solution**:
```bash
cd website/server
npm install
```

### 5. Environment Configuration

**Symptoms**: Email features not working

**Solution**: 
1. Copy `.env.example` to `.env`
2. Add your SMTP credentials:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=contact@theobviouscompany.com
```

### 6. Port Already in Use

**Symptoms**: `EADDRINUSE` error

**Solution**:
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
set PORT=3001
node start-server.js
```

### 7. Node.js Version Issues

**Requirements**: Node.js 18+

**Check version**:
```bash
node --version
```

**Update if needed**: Download from [nodejs.org](https://nodejs.org)

## Development Workflow

### Starting Development
```bash
# Quick start (recommended)
node start-server.js

# Or manual start
cd website/server
npm run dev
```

### Debugging
```bash
# Enable detailed logging
npm run dev:verbose

# Check server health
npm run health

# View logs in VS Code
# Use "Debug Server Only" configuration
```

### Testing Changes
1. Make changes to HTML/CSS/JS files
2. Refresh browser (server auto-restarts for server changes)
3. Check console for any errors

## File Structure

```
├── website/
│   ├── index.html          # Main homepage
│   ├── css/styles.css      # Main stylesheet
│   ├── js/
│   │   ├── main.js         # Main JavaScript
│   │   ├── analytics.js    # Analytics tracking
│   │   └── assessment-cta.js # Assessment CTAs
│   ├── server/
│   │   ├── server.js       # Express server
│   │   └── package.json    # Dependencies
│   └── .env               # Environment config
├── .vscode/
│   ├── launch.json        # VS Code debug config
│   └── tasks.json         # VS Code tasks
├── start-server.js        # Startup script
└── TROUBLESHOOTING.md     # This file
```

## VS Code Configuration

### Debug Configurations Available:
1. **Launch Website with Server** - Starts server in debug mode
2. **Launch Chrome (with server)** - Starts server + opens Chrome
3. **Debug Server Only** - Server debugging without browser

### Recommended Extensions:
- Node.js Extension Pack
- Thunder Client (for API testing)
- Live Server (for static file testing)

## Performance Optimizations Applied

### Rate Limits (Optimized for Development):
- ✅ General: 5000 requests per 15 minutes
- ✅ Forms: 50 submissions per 15 minutes
- ✅ API: 500 requests per 15 minutes
- ✅ Analytics: Graceful failure handling

### Error Handling:
- ✅ Comprehensive error middleware
- ✅ Graceful analytics failures
- ✅ Form submission timeouts
- ✅ 404 page handling

### Client-Side Improvements:
- ✅ Better script loading with fallbacks
- ✅ Network timeout handling
- ✅ Improved error messages
- ✅ Performance monitoring

## Getting Help

### Check These First:
1. Is the server running? `http://localhost:3000/api/health`
2. Any console errors? (F12 → Console)
3. Correct Node.js version? `node --version`
4. Dependencies installed? `npm list` in server folder

### Common Commands:
```bash
# Health check
curl http://localhost:3000/api/health

# View server logs
cd website/server && npm run dev:verbose

# Restart everything
# Ctrl+C to stop, then:
node start-server.js

# Test contact form
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

### Still Having Issues?
1. Check the server console output for detailed error messages
2. Verify all files are in the correct locations
3. Try deleting `node_modules` and running `npm install` again
4. Make sure no other applications are using port 3000

## Success Indicators

When everything is working correctly, you should see:
- ✅ Server starts without errors
- ✅ `http://localhost:3000` loads the homepage
- ✅ No console errors in browser
- ✅ Contact forms work
- ✅ Analytics tracking works silently
- ✅ All navigation works properly