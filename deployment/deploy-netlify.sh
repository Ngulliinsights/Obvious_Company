#!/bin/bash

# The Obvious Company - Netlify Deployment Script
echo "🚀 Deploying to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=website

echo "✅ Deployment complete!"
echo "🌐 Your website is now live on Netlify"
echo "🔧 Don't forget to set environment variables in Netlify dashboard"
