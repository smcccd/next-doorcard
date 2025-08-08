# Production Migration Deployment Guide

## Two-Phase Deployment Strategy

### Phase 1: Local Test (Recommended First)

```bash
# Test the migration logic on local SQLite
npx tsx scripts/local-migration-test.ts

# Monitor progress
tail -f local-migration.log
```

### Phase 2: Neon Production Deployment

```bash
# Deploy to Neon PostgreSQL
npx tsx scripts/neon-migration-deploy.ts

# Monitor progress in another terminal
tail -f neon-migration.log
```

## What Each Script Does

### Local Test Script

- ✅ Tests name capitalization fixes
- ✅ Validates database queries work
- ✅ Checks for remaining overlaps
- ✅ Simulates production operations
- ✅ No data changes (read-only test)

### Neon Deployment Script

- ✅ Extracts clean data from local SQLite
- ✅ Connects to your Neon PostgreSQL database
- ✅ Clears existing Neon data
- ✅ Migrates users with proper capitalization
- ✅ Migrates active doorcards (Fall 2025)
- ✅ Migrates conflict-free appointments
- ✅ Validates final state

## Pre-Deployment Checklist

- [ ] **Neon database created** with connection string ready
- [ ] **Local database clean** (no overlapping appointments)
- [ ] **Backup created** of current state
- [ ] **Test environment verified**

## Success Criteria

### Local Test Should Show:

- Zero overlap conflicts
- Proper name capitalization examples
- Successful query execution
- System readiness confirmation

### Neon Deployment Should Show:

- ~51 users migrated
- ~51 active doorcards migrated
- ~117 appointments migrated
- Final validation successful
- Production system live

## Emergency Rollback

If Neon migration fails:

1. **Database Level**: Drop/recreate Neon database
2. **Application Level**: Revert DATABASE_URL to SQLite
3. **Logs Available**: All operations logged for troubleshooting

## Post-Migration Verification

Test these URLs after Neon deployment:

- Faculty search functionality
- Individual doorcard views (`/view/username`)
- No overlapping appointments in schedules
- Proper name capitalization display

---

**Ready to deploy? Start with local test, then proceed to Neon when confident.**
