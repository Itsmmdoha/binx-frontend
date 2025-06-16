#!/bin/bash

echo "🧹 Performing complete cleanup..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

echo "🔧 Clearing npm cache..."
npm cache clean --force

echo "📦 Installing clean dependencies..."
npm install

echo "✅ Installation complete!"
echo ""
echo "🔍 Checking for problematic packages..."
if npm ls react-day-picker 2>/dev/null | grep -q "react-day-picker"; then
    echo "❌ react-day-picker still found"
else
    echo "✅ react-day-picker successfully excluded"
fi

if npm ls date-fns 2>/dev/null | grep -q "date-fns"; then
    echo "❌ date-fns still found"
else
    echo "✅ date-fns successfully excluded"
fi

echo ""
echo "🚀 Ready to start development server with: npm run dev"
