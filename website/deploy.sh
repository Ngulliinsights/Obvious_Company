#!/bin/bash

# The Obvious Company Website Deployment Script

echo "🚀 Deploying The Obvious Company Website..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Start the server
echo "🌟 Starting server..."
if [ "$1" = "dev" ]; then
    echo "🔧 Starting in development mode..."
    npm run dev
else
    echo "🚀 Starting in production mode..."
    npm start
fi