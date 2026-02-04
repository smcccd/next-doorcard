#!/bin/bash

# Emergency Neon Database Fix Script

echo "🚨 Emergency Neon Database Fix"
echo "==============================="

# Connection strings
export DATABASE_URL="postgresql://neondb_owner:npg_DbzR2T3xjVXq@ep-withered-forest-a6zi4dki-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://neondb_owner:npg_DbzR2T3xjVXq@ep-withered-forest-a6zi4dki.us-west-2.aws.neon.tech/neondb?sslmode=require"

echo ""
echo "1. Testing database connection..."
echo "   Pooled URL: ${DATABASE_URL//:npg_*@/:***@/}"
echo "   Direct URL: ${DIRECT_URL//:npg_*@/:***@/}"

# Test connection with psql if available
if command -v psql &> /dev/null; then
    echo ""
    echo "2. Testing direct connection with psql..."
    psql "$DIRECT_URL" -c "SELECT version();" 2>&1 | head -n 3
else
    echo "   psql not installed, skipping connection test"
fi

echo ""
echo "3. Generating Prisma Client..."
npx prisma generate

echo ""
echo "4. Running database migrations..."
npx prisma migrate deploy

echo ""
echo "5. Checking migration status..."
npx prisma migrate status

echo ""
echo "✅ Done! Please verify in Vercel dashboard that:"
echo "   - DATABASE_URL is set (with -pooler)"
echo "   - DIRECT_URL is set (without -pooler)"
echo "   - Redeploy the application"