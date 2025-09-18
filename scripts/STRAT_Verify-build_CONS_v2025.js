---
title: "Verify-build"
type: "strategic"
audience: "consultants"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

#!/usr/bin/env node

/**
 * Build verification script for Railway deployment
 * Ensures all required files and configurations are ready
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build configuration...\n');

const checks = [
    {
        name: 'Package.json exists',
        check: () => fs.existsSync('config/package.json'),
        required: true
    },
    {
        name: 'Server package.json exists',
        check: () => fs.existsSync('website/server/package.json'),
        required: true
    },
    {
        name: 'Server.js exists',
        check: () => fs.existsSync('website/server/server.js'),
        required: true
    },
    {
        name: 'Railway.json exists',
        check: () => fs.existsSync('railway.json'),
        required: true
    },
    {
        name: 'Procfile exists',
        check: () => fs.existsSync('Procfile'),
        required: true
    },
    {
        name: 'Main CSS file exists',
        check: () => fs.existsSync('website/css/styles.css'),
        required: true
    },
    {
        name: 'Index.html exists',
        check: () => fs.existsSync('website/index.html'),
        required: true
    },
    {
        name: 'Environment example exists',
        check: () => fs.existsSync('website/.env.example'),
        required: false
    },
    {
        name: 'Railway environment template exists',
        check: () => fs.existsSync('website/.env.railway'),
        required: false
    },
    {
        name: 'Deployment guide exists',
        check: () => fs.existsSync('RAILWAY_DEPLOYMENT.md'),
        required: false
    }
];

let passed = 0;
let failed = 0;
let warnings = 0;

checks.forEach(({ name, check, required }) => {
    const result = check();
    
    if (result) {
        console.log(`✅ ${name}`);
        passed++;
    } else if (required) {
        console.log(`❌ ${name} (REQUIRED)`);
        failed++;
    } else {
        console.log(`⚠️  ${name} (optional)`);
        warnings++;
    }
});

console.log(`\n📊 Build Verification Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   ⚠️  Warnings: ${warnings}`);

if (failed > 0) {
    console.log(`\n💥 Build verification failed! Fix the required issues above.`);
    process.exit(1);
} else {
    console.log(`\n🎉 Build verification passed! Ready for Railway deployment.`);
    
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Set environment variables in Railway`);
    console.log(`   2. Deploy: railway up`);
    console.log(`   3. Test: https://your-app.railway.app/api/health`);
    
    process.exit(0);
}