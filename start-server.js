#!/usr/bin/env node

/**
 * Startup script for The Obvious Company website
 * Handles dependency installation, environment setup, and server startup
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 The Obvious Company - Server Startup Script');
console.log('===============================================\n');

// Configuration
const SERVER_DIR = path.join(__dirname, 'website', 'server');
const ENV_FILE = path.join(__dirname, 'website', '.env');
const ENV_EXAMPLE = path.join(__dirname, 'website', '.env.example');

// Utility functions
function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`📝 Running: ${command} ${args.join(' ')}`);
        
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        
        child.on('error', reject);
    });
}

function checkFile(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

async function checkNodeVersion() {
    console.log('🔍 Checking Node.js version...');
    
    try {
        const version = process.version;
        const majorVersion = parseInt(version.slice(1).split('.')[0]);
        
        if (majorVersion < 18) {
            console.warn(`⚠️  Warning: Node.js ${version} detected. Recommended: Node.js 18+`);
        } else {
            console.log(`✅ Node.js ${version} - OK`);
        }
    } catch (error) {
        console.error('❌ Failed to check Node.js version:', error.message);
    }
}

async function setupEnvironment() {
    console.log('\n🔧 Setting up environment...');
    
    if (!checkFile(ENV_FILE)) {
        if (checkFile(ENV_EXAMPLE)) {
            console.log('📋 Copying .env.example to .env...');
            try {
                fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
                console.log('✅ Environment file created');
                console.log('⚠️  Please edit website/.env with your SMTP credentials');
            } catch (error) {
                console.error('❌ Failed to copy environment file:', error.message);
            }
        } else {
            console.log('📝 Creating basic .env file...');
            const basicEnv = `# The Obvious Company - Environment Configuration
NODE_ENV=development
PORT=3000
WEBSITE_URL=http://localhost:3000

# Email Configuration (Required for contact forms)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# CONTACT_EMAIL=contact@theobviouscompany.com

# Optional: Enable detailed logging
DETAILED_LOGGING=true
`;
            try {
                fs.writeFileSync(ENV_FILE, basicEnv);
                console.log('✅ Basic environment file created');
                console.log('⚠️  Please edit website/.env with your SMTP credentials');
            } catch (error) {
                console.error('❌ Failed to create environment file:', error.message);
            }
        }
    } else {
        console.log('✅ Environment file exists');
    }
}

async function installDependencies() {
    console.log('\n📦 Installing dependencies...');
    
    if (!checkFile(path.join(SERVER_DIR, 'package.json'))) {
        console.error('❌ package.json not found in server directory');
        return false;
    }
    
    try {
        await runCommand('npm', ['install'], { cwd: SERVER_DIR });
        console.log('✅ Dependencies installed successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   • Make sure npm is installed: npm --version');
        console.log('   • Try clearing npm cache: npm cache clean --force');
        console.log('   • Delete node_modules and try again');
        return false;
    }
}

async function startServer() {
    console.log('\n🚀 Starting server...');
    
    const serverPath = path.join(SERVER_DIR, 'server.js');
    
    if (!checkFile(serverPath)) {
        console.error('❌ server.js not found');
        return;
    }
    
    // Set environment variables
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    process.env.PORT = process.env.PORT || '3000';
    process.env.DETAILED_LOGGING = 'true';
    
    console.log('🌐 Server will be available at: http://localhost:' + (process.env.PORT || '3000'));
    console.log('🛑 Press Ctrl+C to stop the server\n');
    
    try {
        // Use spawn to keep the process running
        const serverProcess = spawn('node', ['server.js'], {
            cwd: SERVER_DIR,
            stdio: 'inherit',
            shell: true,
            env: { ...process.env }
        });
        
        serverProcess.on('error', (error) => {
            console.error('❌ Failed to start server:', error.message);
        });
        
        serverProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Server exited with code ${code}`);
            } else {
                console.log('✅ Server stopped gracefully');
            }
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down server...');
            serverProcess.kill('SIGINT');
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Shutting down server...');
            serverProcess.kill('SIGTERM');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   • Check if port 3000 is already in use');
        console.log('   • Verify all dependencies are installed');
        console.log('   • Check the .env file configuration');
    }
}

// Main execution
async function main() {
    try {
        await checkNodeVersion();
        await setupEnvironment();
        
        const depsInstalled = await installDependencies();
        if (!depsInstalled) {
            console.log('\n❌ Cannot start server without dependencies');
            process.exit(1);
        }
        
        await startServer();
        
    } catch (error) {
        console.error('\n💥 Startup failed:', error.message);
        console.log('\n🔧 For help, check:');
        console.log('   • README.md for setup instructions');
        console.log('   • .env file for configuration');
        console.log('   • Node.js and npm versions');
        process.exit(1);
    }
}

// Run the startup script
if (require.main === module) {
    main();
}

module.exports = { main };