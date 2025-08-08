# Production Legacy Data Import Guide

## Overview

This guide covers the production import of legacy doorcard data from the old
Classic ASP system into the new Next.js application.

## Prerequisites

### Environment Setup

1. **Database**: Production PostgreSQL database configured
2. **Environment**: All production environment variables set
3. **Data**: Latest export of legacy Access database as CSV files
4. **Backup**: Full database backup taken before import
5. **Access**: Database admin access for import operations

### Required CSV Files

Place these files in the `db-items/` directory:

- `TBL_USER (2).csv` - User table (minimal, LDAP-based system)
- `TBL_DOORCARD (1).csv` - Doorcard records
- `TBL_APPOINTMENT (1).csv` - Office hours/appointments
- `TBL_CATEGORY (1).csv` - Appointment categories
- `TBL_TEMPLATE (1).csv` - Legacy templates (not imported)

## Import Process

### Step 1: Pre-Import Validation

**Run diagnostic dry-run:**

```bash
npm run import-legacy:debug-dry
```

**Review the generated report:**

- Check `import-debug-report-[timestamp].json`
- Verify user counts match expectations
- Confirm no critical errors

**Expected Results:**

- Users Found: ~2,271 (from doorcard/appointment references)
- Users to Create: ~2,271 (LDAP system, minimal local users)
- Zero critical validation errors

### Step 2: Production Import

**⚠️ CRITICAL: Take Database Backup First**

```bash
# PostgreSQL backup example
pg_dump $DATABASE_URL > backup-pre-import-$(date +%Y%m%d_%H%M%S).sql
```

**Run Production Import:**

```bash
# Full debug logging
npm run import-legacy:debug

# Or standard import (less verbose)
npm run import-legacy
```

**Monitor Progress:**

- Import creates ~2,271 users first
- Then processes ~10,944 doorcards
- Finally processes ~184,935 appointments
- Total time: ~15-30 minutes depending on database

### Step 3: Post-Import Validation

**Verify Data Integrity:**

```bash
# Check record counts
psql $DATABASE_URL -c "
SELECT
  (SELECT COUNT(*) FROM \"User\") as users,
  (SELECT COUNT(*) FROM \"Doorcard\") as doorcards,
  (SELECT COUNT(*) FROM \"Appointment\") as appointments;
"
```

**Expected Results:**

- Users: ~2,271
- Doorcards: ~10,944
- Appointments: Variable (depends on data quality)

**Check for Rejections:**

- Review files in `rejects/` directory
- High rejection rates are expected due to data quality issues
- Focus on successful imports, not rejection count

## Troubleshooting

### Common Issues

**1. User Creation Fails**

```
Error: Users Created: 0 (expected: 2,271)
```

**Solution:**

- Check database constraints
- Verify schema matches (PostgreSQL vs SQLite)
- Review error details in debug report

**2. High Rejection Rates**

```
Error: 90%+ of doorcards/appointments rejected
```

**This is expected** due to:

- Legacy data quality issues
- Missing user relationships
- Invalid date formats
- Constraint violations

**3. Memory Issues**

```
Error: JavaScript heap out of memory
```

**Solution:**

```bash
# Increase Node.js memory
node --max-old-space-size=4096 node_modules/.bin/tsx scripts/import-legacy-debug.ts
```

### Recovery Procedures

**If Import Fails Midway:**

1. Stop the import process
2. Restore from backup: `psql $DATABASE_URL < backup-pre-import-[timestamp].sql`
3. Review debug report for specific errors
4. Fix data issues and retry

**Partial Success Scenario:**

- Users created successfully, but doorcards/appointments failed
- Can re-run import safely (uses `skipDuplicates: true`)
- Script will skip existing users and only process new data

## OneLogin Integration

### User Account Mapping

- Import creates users with `username@smccd.edu` emails
- OneLogin SSO will match users by email domain
- Faculty get historical data automatically on first login
- No password management needed (OneLogin handles auth)

### Post-Import OneLogin Setup

1. Configure OneLogin SAML/OIDC integration
2. Set user attribute mapping (email → username)
3. Test with pilot faculty members
4. Verify historical doorcard access works

## Data Quality Expectations

### Expected Success Rates

- **Users**: ~95% success (2,200+ users created)
- **Doorcards**: ~30-50% success (3,000-5,500 imported)
- **Appointments**: ~10-20% success (18,000-37,000 imported)

**Low success rates are normal** due to:

- Legacy system data inconsistencies
- Missing user references from LDAP integration
- Date format variations
- Duplicate records across terms

### Success Criteria

✅ **Minimum viable import:**

- 2,000+ users created
- 2,500+ doorcards imported
- 15,000+ appointments imported
- No critical system errors

## Rollback Plan

**If major issues occur after production deployment:**

1. **Immediate rollback:**

   ```bash
   psql $DATABASE_URL < backup-pre-import-[timestamp].sql
   ```

2. **Alternative approach:**

   ```bash
   npm run import-legacy:rollback
   ```

3. **Selective cleanup:**
   - Delete imported users only
   - Preserve existing application data
   - Requires manual SQL operations

## Production Checklist

### Pre-Import

- [ ] Database backup completed
- [ ] CSV files in correct location
- [ ] Environment variables verified
- [ ] Debug dry-run completed successfully
- [ ] Import window scheduled (maintenance mode)

### During Import

- [ ] Monitor import progress logs
- [ ] Watch for memory/disk usage
- [ ] Record start/end times
- [ ] Save debug report

### Post-Import

- [ ] Verify record counts
- [ ] Test user authentication flow
- [ ] Spot-check doorcard data accuracy
- [ ] OneLogin integration tested
- [ ] Generate final import report

## Files and Scripts

### Import Scripts

- `scripts/import-legacy.ts` - Production import script
- `scripts/import-legacy-debug.ts` - Enhanced debugging version
- `scripts/rollback-import.ts` - Rollback utility

### Generated Files

- `import-debug-report-[timestamp].json` - Detailed import results
- `rejects/TBL_DOORCARD.csv` - Rejected doorcard records
- `rejects/TBL_APPOINTMENT.csv` - Rejected appointment records

### Commands

- `npm run import-legacy:debug-dry` - Validation run
- `npm run import-legacy:debug` - Full debug import
- `npm run import-legacy` - Standard import
- `npm run import-legacy:rollback` - Undo import

## Support Contacts

- **Technical Issues**: Development team
- **Data Questions**: Bryan Besnyi (original system admin)
- **OneLogin Setup**: IT Security team
- **Production Deployment**: DevOps team
