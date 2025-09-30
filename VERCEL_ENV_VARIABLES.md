# Vercel Environment Variables Configuration

## ✅ Database is Ready!

The Neon PostgreSQL database has been successfully configured and migrations are deployed.

## Required Environment Variables for Vercel

Add these to your Vercel project settings → Environment Variables:

```bash
# Primary Database URLs (Required)
DATABASE_URL="postgresql://neondb_owner:npg_Sup5dyCXawK2@ep-still-moon-afse7st5-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_Sup5dyCXawK2@ep-still-moon-afse7st5.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"

# Alternative Names (for compatibility)
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_Sup5dyCXawK2@ep-still-moon-afse7st5.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
POSTGRES_PRISMA_URL="postgresql://neondb_owner:npg_Sup5dyCXawK2@ep-still-moon-afse7st5-pooler.c-2.us-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"

# Individual Components (Optional)
PGHOST="ep-still-moon-afse7st5-pooler.c-2.us-west-2.aws.neon.tech"
PGHOST_UNPOOLED="ep-still-moon-afse7st5.c-2.us-west-2.aws.neon.tech"
PGUSER="neondb_owner"
PGDATABASE="neondb"
PGPASSWORD="npg_Sup5dyCXawK2"

# Fallback Term Configuration (keep existing)
FALLBACK_ACTIVE_TERM_SEASON="FALL"
FALLBACK_ACTIVE_TERM_YEAR="2025"
```

## Steps to Complete:

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to Settings → Environment Variables

2. **Add the Variables**
   - Add at minimum `DATABASE_URL` and `DIRECT_URL`
   - Make sure they're available for Production environment

3. **Redeploy**
   - Trigger a new deployment
   - Or push any commit to trigger automatic deployment

## Verification:

✅ Database connected successfully
✅ Migrations deployed (2 migrations applied)
✅ Schema tables created:
   - Appointment
   - Doorcard
   - DoorcardAnalytics
   - DoorcardMetrics
   - Term
   - User

## Database Info:
- **Provider**: PostgreSQL 17.5
- **Database**: neondb
- **Region**: us-west-2
- **Pooler**: PgBouncer enabled

## Status: READY FOR PRODUCTION 🚀

The database is empty but fully configured. Once you add these environment variables to Vercel, your application will connect successfully.