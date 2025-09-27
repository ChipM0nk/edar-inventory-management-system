#!/bin/bash

# Optimized development script for Next.js
echo "🚀 Starting optimized Next.js development server..."

# Set environment variables for better performance
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"
export FAST_REFRESH=true

# Clear Next.js cache for fresh start
echo "🧹 Clearing Next.js cache..."
rm -rf .next

# Start development server with optimizations
echo "⚡ Starting dev server with Turbo..."
npm run dev
