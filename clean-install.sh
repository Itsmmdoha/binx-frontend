#!/bin/bash

echo "🧹 Complete cleanup..."
rm -rf node_modules package-lock.json yarn.lock

echo "🔧 Clearing npm cache..."
npm cache clean --force

echo "📦 Installing with clean dependencies..."
npm install

echo "✅ Checking for problematic packages..."
if npm ls | grep -E "(react-day-picker|date-fns)" > /dev/null 2>&1; then
    echo "❌ Still found problematic packages:"
    npm ls | grep -E "(react-day-picker|date-fns)"
    echo ""
    echo "🔧 The packages above are likely from shadcn/ui components."
    echo "   The app should still work correctly with --legacy-peer-deps"
else
    echo "✅ Clean installation - no problematic packages found"
fi

echo ""
echo "🚀 Ready to start: npm run dev"
