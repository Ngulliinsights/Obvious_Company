// Simple startup script for Railway
const path = require('path');
const serverPath = path.join(__dirname, 'website', 'server', 'server.js');

console.log('🚀 Starting The Obvious Company server...');
console.log('📁 Server path:', serverPath);

// Start the main server
require(serverPath);
