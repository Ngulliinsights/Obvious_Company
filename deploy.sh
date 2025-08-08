#!/bin/bash

# The Obvious Company - Railway Deployment Script
echo "🚂 Deploying to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Check your Railway dashboard for the live URL"