#!/bin/bash

echo "🧹 Complete cleanup..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

echo "🔧 Clearing all caches..."
npm cache clean --force

echo "📦 Installing minimal dependencies..."
npm install --no-optional --no-fund --no-audit

echo "✅ Checking for problematic packages..."
if npm ls | grep -E "(react-day-picker|date-fns)" > /dev/null 2>&1; then
    echo "❌ Still found problematic packages"
    npm ls | grep -E "(react-day-picker|date-fns)"
else
    echo "✅ Clean installation - no problematic packages found"
fi

echo ""
echo "🚀 Ready to start: npm run dev"
