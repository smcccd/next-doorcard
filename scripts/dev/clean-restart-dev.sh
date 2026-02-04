#!/bin/bash

echo "🧹 Cleaning development environment..."

# Kill all existing dev processes
echo "  🚫 Stopping all Next.js processes..."
pkill -f "node.*dev" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true

# Wait for processes to fully stop
sleep 3

# Remove build artifacts
echo "  🗑️  Removing build cache..."
rm -rf .next
rm -rf node_modules/.cache

# Clear any cached server actions
echo "  ⚡ Clearing cached data..."
rm -rf .next/cache 2>/dev/null || true

# Optional: regenerate Prisma client to ensure fresh database connection
echo "  📊 Regenerating Prisma client..."
npx prisma generate

echo "✅ Environment cleaned! Starting fresh development server..."
echo ""

# Start development server
npm run dev