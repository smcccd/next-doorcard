# Production Migration & Go-Live Guide

**Last Updated**: November 24, 2025
**Project**: Next Doorcard - Faculty Doorcard System
**Current Status**: Development → Production Migration

---

## Overview

This guide covers migrating the Next Doorcard application from development to production, including:

1. Database migration from Neon free tier to production PostgreSQL
2. GitHub repository transfer to new organization
3. Vercel project migration to new organization
4. Production environment configuration
5. Pre-launch checklist

---

## 1. Database Migration (Neon Free Tier → Production)

### Current Issue
- Neon free tier at 100% usage
- Need production-grade PostgreSQL database

### Production Database Options

#### Option A: Neon Pro/Scale Plan (Recommended)
**Pros:**
- Seamless migration (same provider)
- Excellent Next.js integration
- Serverless/auto-scaling
- 0.5 TB storage (Pro), Unlimited (Scale)
- Branch/preview database support

**Pricing:**
- Pro: $19/month (0.5 TB storage, 20 GB RAM)
- Scale: $69/month (Unlimited storage, 40 GB RAM)

**Migration Steps:**
```bash
# 1. Upgrade Neon project tier
#    - Go to Neon dashboard → Project Settings → Plan
#    - Upgrade to Pro or Scale

# 2. Update connection string (if it changes)
#    - Copy new DATABASE_URL from Neon
#    - Update Vercel environment variables

# 3. No data migration needed - same database!
```

#### Option B: Vercel Postgres (Built-in)
**Pros:**
- Native Vercel integration
- No separate provider needed
- Automatic backups
- Branch database support

**Pricing:**
- Pro: $20/month (256 MB)
- Enterprise: Custom pricing (larger databases)

**Migration Steps:**
```bash
# 1. Create Vercel Postgres in project dashboard
#    Vercel Dashboard → Storage → Create Database → Postgres

# 2. Data migration required
npx prisma db push --force-reset  # WARNING: Loses data
# OR use pg_dump/pg_restore:

# Export from Neon
pg_dump $OLD_DATABASE_URL > backup.sql

# Import to Vercel Postgres
psql $NEW_DATABASE_URL < backup.sql

# 3. Update DATABASE_URL in Vercel
```

#### Option C: Self-Hosted (SMCCD Infrastructure)
**Pros:**
- Full control
- Potentially lower cost long-term
- Compliance/security control

**Cons:**
- Requires infrastructure management
- Backup/scaling responsibility
- Network configuration needed

**Migration Steps:**
1. Provision PostgreSQL server (version 14+)
2. Configure network access (whitelist Vercel IPs)
3. Export data from Neon, import to new server
4. Update DATABASE_URL

---

## 2. GitHub Repository Transfer

### Prerequisites
- Admin access to source repository
- Admin/Owner access to target organization
- Team members notified of transfer

### Transfer Steps

```bash
# 1. Clean up local branches
git fetch --prune
git branch -d <old-feature-branches>

# 2. Ensure all changes are pushed
git push origin main

# 3. Create final backup
git clone --mirror https://github.com/YOUR_USERNAME/next-doorcard.git next-doorcard-backup

# 4. Transfer repository via GitHub UI:
#    Settings → General → Transfer ownership
#    - Enter new organization name: [NEW_ORG_NAME]
#    - Confirm transfer

# 5. Update local remotes
git remote set-url origin https://github.com/[NEW_ORG]/next-doorcard.git
git remote -v  # Verify

# 6. Update collaborators/teams in new org
#    Settings → Collaborators → Manage access
```

### Post-Transfer Checklist
- [ ] All team members have access
- [ ] Branch protection rules configured on `main`
- [ ] Secrets/Actions configured (if any)
- [ ] Repository settings reviewed (visibility, features)
- [ ] README updated with new org references

---

## 3. Vercel Project Migration

### Option A: Transfer Existing Project

```bash
# 1. In current Vercel dashboard:
#    Project Settings → Advanced → Transfer Project
#    - Select target Vercel organization
#    - Confirm transfer

# 2. Update GitHub integration:
#    Settings → Git → Configure
#    - Reconnect to new GitHub org/repo

# 3. Verify environment variables preserved
#    Settings → Environment Variables → Review all
```

### Option B: Create New Project (Cleaner)

```bash
# 1. In NEW Vercel org dashboard:
#    Add New → Project → Import Git Repository
#    - Connect GitHub (new org)
#    - Select next-doorcard repository

# 2. Configure project settings:
#    - Framework Preset: Next.js
#    - Build Command: npm run build
#    - Output Directory: .next
#    - Install Command: npm install

# 3. Import environment variables:
#    - Use CLI: vercel env pull .env.production
#    - Or manually copy from old project

# 4. Deploy
```

### Environment Variables to Configure

**Critical (Required):**
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="[generate-new-for-production]"
NEXTAUTH_URL="https://doorcard.smccd.edu"
ONELOGIN_CLIENT_ID="[prod-client-id]"
ONELOGIN_CLIENT_SECRET="[prod-secret]"
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."
```

**Important:**
```bash
NODE_ENV="production"
ENABLE_RATE_LIMITING="true"
ENABLE_AUTH_DEBUG="false"
LOG_LEVEL="error"
NEXT_PUBLIC_SHOW_BETA_BANNER="false"
```

**Analytics:**
```bash
NEXT_PUBLIC_CLARITY_ID="[clarity-project-id]"
```

**Optional:**
```bash
SENTRY_AUTH_TOKEN="[for-source-maps]"
FALLBACK_ACTIVE_TERM_SEASON="FALL"
FALLBACK_ACTIVE_TERM_YEAR="2025"
```

---

## 4. Domain & DNS Configuration

### Custom Domain Setup

```bash
# 1. In Vercel Dashboard:
#    Project → Settings → Domains
#    - Add domain: doorcard.smccd.edu

# 2. DNS Configuration (in SMCCD DNS):
#    Type: CNAME
#    Name: doorcard
#    Value: cname.vercel-dns.com
#    TTL: 3600

# 3. SSL Certificate:
#    Vercel auto-provisions Let's Encrypt cert
#    Wait 24-48 hours for propagation

# 4. Redirect Configuration:
#    - Redirect www → non-www (or vice versa)
#    - Force HTTPS (automatic in Vercel)
```

### OneLogin Configuration

```bash
# Update OneLogin OAuth Redirect URIs:
# - https://doorcard.smccd.edu/api/auth/callback/onelogin
# - Remove development/preview URLs from production app
```

---

## 5. Database Migration Commands

### Export Data from Neon (Current)

```bash
# Get connection string
echo $DATABASE_URL

# Option 1: Using Prisma
npx prisma db pull  # Update schema
npx prisma db push  # Apply to new DB (after updating DATABASE_URL)

# Option 2: Direct SQL dump
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > doorcard_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh doorcard_backup_*.sql
```

### Import to New Production Database

```bash
# Set new DATABASE_URL
export NEW_DATABASE_URL="postgresql://..."

# Import data
psql "$NEW_DATABASE_URL" < doorcard_backup_YYYYMMDD_HHMMSS.sql

# Verify tables
psql "$NEW_DATABASE_URL" -c "\dt"

# Run Prisma migrations (ensures schema up-to-date)
export DATABASE_URL="$NEW_DATABASE_URL"
npx prisma migrate deploy

# Verify data
npx prisma studio  # Opens GUI to inspect data
```

---

## 6. Production Pre-Launch Checklist

### Database
- [ ] Production database provisioned and configured
- [ ] Data migrated from Neon (if applicable)
- [ ] Connection pooling configured (Prisma connection limit)
- [ ] Backup strategy confirmed
- [ ] Database credentials secured in Vercel

### GitHub & Vercel
- [ ] Repository transferred to new organization
- [ ] All team members have access
- [ ] Vercel project migrated/created in new org
- [ ] GitHub integration connected to new repo
- [ ] Branch protection rules configured

### Environment Configuration
- [ ] All environment variables configured in Vercel
- [ ] NEXTAUTH_SECRET regenerated for production
- [ ] NEXTAUTH_URL set to production domain
- [ ] OneLogin production credentials configured
- [ ] Sentry production DSN configured
- [ ] Rate limiting enabled (`ENABLE_RATE_LIMITING="true"`)
- [ ] Debug mode disabled (`ENABLE_AUTH_DEBUG="false"`)
- [ ] Beta banner disabled (`NEXT_PUBLIC_SHOW_BETA_BANNER="false"`)

### Domain & DNS
- [ ] Custom domain configured in Vercel
- [ ] DNS CNAME record added
- [ ] SSL certificate provisioned (automatic)
- [ ] OneLogin redirect URIs updated
- [ ] HTTP → HTTPS redirect working

### Security
- [ ] Security headers configured (already in `next.config.ts`)
- [ ] Rate limiting enabled
- [ ] Sentry error tracking active
- [ ] SQL injection protections verified (Prisma)
- [ ] XSS protections verified (input sanitization)

### Performance
- [ ] Build successful: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Lighthouse score checked (>90)
- [ ] Database indexes reviewed
- [ ] Image optimization configured

### Testing
- [ ] Manual UAT testing completed
- [ ] All user workflows tested (create, edit, publish)
- [ ] Authentication flow tested (OneLogin)
- [ ] PDF generation tested
- [ ] Mobile responsive testing
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

### Documentation
- [ ] Production URL documented
- [ ] Admin credentials secured
- [ ] User documentation updated
- [ ] Troubleshooting guide created
- [ ] Support contact information added

### Monitoring
- [ ] Sentry alerts configured
- [ ] Uptime monitoring configured (optional)
- [ ] Microsoft Clarity analytics tracking
- [ ] Error notification emails configured
- [ ] Performance monitoring baseline captured

### Rollback Plan
- [ ] Database backup verified and tested
- [ ] Previous Vercel deployment marked (can rollback)
- [ ] Emergency contact list created
- [ ] Rollback procedure documented

---

## 7. Post-Launch Monitoring (First 48 Hours)

### Immediate Checks (First Hour)
```bash
# Health check
curl https://doorcard.smccd.edu/health

# Verify authentication
# - Test OneLogin login
# - Create test doorcard
# - Generate PDF

# Check logs
vercel logs doorcard.smccd.edu --follow
```

### Monitor
- [ ] Sentry error dashboard (first 24 hours)
- [ ] Database performance metrics
- [ ] User login success rate
- [ ] Page load times
- [ ] PDF generation success rate

### User Support
- [ ] Support email/form ready
- [ ] Known issues documented
- [ ] User feedback mechanism active

---

## 8. Rollback Procedure (If Needed)

### Emergency Rollback

```bash
# 1. In Vercel Dashboard:
#    Deployments → [Previous Deployment] → Actions → Promote to Production

# 2. If database issue, restore backup:
psql "$DATABASE_URL" < doorcard_backup_YYYYMMDD_HHMMSS.sql

# 3. Notify users of temporary rollback

# 4. Investigate issue in staging
```

---

## 9. Cost Estimation (Monthly)

### Scenario 1: Neon Pro + Vercel Pro
- Neon Pro: $19/month
- Vercel Pro: $20/month
- **Total: ~$39/month**

### Scenario 2: Vercel Postgres + Vercel Pro
- Vercel Pro: $20/month
- Vercel Postgres Pro: $20/month
- **Total: ~$40/month**

### Scenario 3: Self-Hosted DB + Vercel Pro
- Vercel Pro: $20/month
- Self-hosted DB: $0 (SMCCD infrastructure)
- **Total: ~$20/month** (plus internal IT costs)

### Additional Costs
- Sentry: Free tier (5K errors/month)
- Microsoft Clarity: Free
- Domain: Existing SMCCD domain (no cost)
- OneLogin: Existing SMCCD license

---

## 10. Support Contacts

### Technical Support
- **Vercel Support**: support@vercel.com (Pro plan includes support)
- **Neon Support**: support@neon.tech
- **Sentry Support**: support@sentry.io

### Internal
- **Development Team**: [Your Team Contact]
- **IT/Infrastructure**: [SMCCD IT Contact]
- **OneLogin Admin**: [SSO Admin Contact]

---

## 11. Migration Timeline

### Week Before Launch
- [ ] Day -7: Provision production database
- [ ] Day -6: Test data migration
- [ ] Day -5: Transfer GitHub repo
- [ ] Day -4: Configure Vercel in new org
- [ ] Day -3: Update OneLogin redirect URIs
- [ ] Day -2: Final UAT testing
- [ ] Day -1: Stakeholder notification

### Launch Day
- [ ] Morning: Final data migration
- [ ] Morning: Verify all environment variables
- [ ] Noon: Deploy to production
- [ ] Afternoon: DNS update (if needed)
- [ ] Afternoon: Monitor for 4 hours
- [ ] Evening: Status update to stakeholders

### Week After Launch
- [ ] Day +1: Review error logs
- [ ] Day +2: User feedback review
- [ ] Day +3: Performance optimization
- [ ] Day +7: Post-launch retrospective

---

## 12. Emergency Contacts

### Critical Issues
1. **Database Down**: Rollback deployment, investigate DB
2. **Authentication Failing**: Check OneLogin credentials, NEXTAUTH_SECRET
3. **Build Failing**: Check logs, verify environment variables
4. **High Error Rate**: Check Sentry, enable debug logging temporarily

### On-Call Rotation
- [To be defined by team]

---

## Appendix A: Database Connection Strings

### Format
```bash
# PostgreSQL Connection String Format
postgresql://[user]:[password]@[host]:[port]/[database]?[params]

# Example (Neon)
postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Example (Vercel Postgres)
postgresql://default:pass@ep-name-pooler.region.postgres.vercel-storage.com/verceldb?sslmode=require

# Prisma Connection Pooling
postgresql://user:pass@host:port/db?sslmode=require&connection_limit=10&pool_timeout=10
```

---

## Appendix B: Quick Commands Reference

```bash
# Generate new NEXTAUTH_SECRET
openssl rand -base64 32

# Test database connection
psql "$DATABASE_URL" -c "SELECT NOW();"

# Run production build locally
npm run build
npm start

# Check for type errors
npm run type-check

# Analyze bundle size
ANALYZE=true npm run build

# Deploy to Vercel (manual)
vercel --prod

# Pull Vercel environment variables
vercel env pull .env.vercel

# View production logs
vercel logs --prod

# Check deployed version
curl https://doorcard.smccd.edu/api/health
```

---

**END OF MIGRATION GUIDE**
