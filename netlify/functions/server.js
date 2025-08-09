const serverless = require('serverless-http');
const path = require('path');

// Import the Express app
const app = require('../../website/server/server.js');

// Export the serverless function
module.exports.handler = serverless(app);
