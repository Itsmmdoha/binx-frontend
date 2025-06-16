#!/bin/bash

# Clean installation script for BinX Frontend

echo "🧹 Cleaning existing installation..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

echo "📦 Installing dependencies with clean resolution..."
npm install --no-optional --no-fund --no-audit

echo "✅ Installation complete!"
echo "🚀 Run 'npm run dev' to start the development server"
