---
title: "Deploy-minimal"
type: "presentation"
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
 * Create minimal deployment package for Railway
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Creating minimal deployment package...');

// Essential files for deployment
const essentialFiles = [
    'package.json',
    'railway.json',
    'Procfile',
    'website/server/package.json',
    'website/server/server.js',
    'website/index.html',
    'website/about.html',
    'website/services.html',
    'website/contact.html',
    'website/resources.html',
    'website/methodology.html',
    'website/css/styles.css',
    'website/js/main.js',
    'website/sw.js'
];

// Create deployment directory
const deployDir = 'railway-deploy';
if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
}

// Copy essential files
essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const targetPath = path.join(deployDir, file);
        const targetDir = path.dirname(targetPath);
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.copyFileSync(file, targetPath);
        console.log(`✅ Copied: ${file}`);
    } else {
        console.log(`⚠️  Missing: ${file}`);
    }
});

// Copy website assets
const assetsDir = 'website/images';
if (fs.existsSync(assetsDir)) {
    const targetAssetsDir = path.join(deployDir, assetsDir);
    fs.mkdirSync(targetAssetsDir, { recursive: true });
    
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.svg') || file.endsWith('.ico')) {
            fs.copyFileSync(path.join(assetsDir, file), path.join(targetAssetsDir, file));
            console.log(`✅ Copied asset: ${file}`);
        }
    });
}

console.log(`\n🎉 Minimal deployment package created in: ${deployDir}`);
console.log('📁 You can now upload this folder manually or try CLI from this directory');