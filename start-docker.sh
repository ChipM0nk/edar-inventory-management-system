#!/bin/bash

# Script to start Docker Desktop on macOS

echo "🐳 Starting Docker Desktop..."

# Check if Docker Desktop is installed
if [ -d "/Applications/Docker.app" ]; then
    echo "Found Docker Desktop, starting..."
    open -a Docker
    echo "⏳ Waiting for Docker to start (this may take a minute)..."
    
    # Wait for Docker to be ready
    while ! docker ps &> /dev/null; do
        echo "   Still starting..."
        sleep 5
    done
    
    echo "✅ Docker is now running!"
    echo "You can now run: ./setup.sh"
else
    echo "❌ Docker Desktop not found in /Applications/"
    echo "Please install Docker Desktop from: https://docs.docker.com/desktop/mac/install/"
    echo "Or follow the manual setup guide: MANUAL_SETUP.md"
fi



















