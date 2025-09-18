---
title: "Setup"
type: "template"
audience: "consultants"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AI Assessment Platform...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created. Please update with your configuration.\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Dependencies installed successfully.\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Run type check
console.log('🔍 Running TypeScript type check...');
try {
  execSync('npm run type-check', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ TypeScript type check passed.\n');
} catch (error) {
  console.error('❌ TypeScript type check failed:', error.message);
  process.exit(1);
}

// Run tests
console.log('🧪 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ All tests passed.\n');
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}

console.log('🎉 AI Assessment Platform setup completed successfully!');
console.log('\nNext steps:');
console.log('1. Update .env file with your database and Redis configuration');
console.log('2. Create PostgreSQL database: createdb ai_assessment');
console.log('3. Start development server: npm run dev');
console.log('4. Visit http://localhost:3001/api/health to verify setup\n');