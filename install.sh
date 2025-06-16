#!/bin/bash

echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json

echo "📦 Installing dependencies..."
npm install

echo "✅ Installation complete!"
echo "🚀 Run 'npm run dev' to start development server"
