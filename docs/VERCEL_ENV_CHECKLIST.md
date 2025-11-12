# Vercel Environment Variables Checklist

**Generated**: 2025-11-11
**Branch**: upgrade/nextjs-16
**Purpose**: Verify all required environment variables are set in Vercel

---

## Required Environment Variables

### 1. Database Configuration

```bash
# Required for production
DATABASE_URL="postgresql://user:password@host:5432/doorcard?schema=public"
```

**Status**: ☐ Set in Vercel
**Environment**: Production, Preview (optional)
**Notes**:
- Production should use PostgreSQL (Neon, Supabase, or similar)
- Preview deployments can use SQLite or preview database

---

### 2. NextAuth Configuration

```bash
# Required for authentication
NEXTAUTH_URL="https://doorcard.vercel.app"  # Or your custom domain
NEXTAUTH_SECRET="your-secret-from-openssl-rand-base64-32"
```

**Status**: ☐ Set in Vercel
**Environment**: Production, Preview
**Notes**:
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Auto-set by Vercel, but verify it matches your domain
- Should be different between Production and Preview

---

### 3. OneLogin OAuth (CRITICAL)

#### Preview/Development Environment:
```bash
ONELOGIN_CLIENT_ID="98539170-4d57-013e-d6e5-000a35a0c08e123472"
ONELOGIN_CLIENT_SECRET="0ca253cf36440b4a0b390412e2bbe3b728b18119276c682db1f234e5be28049a"
ONELOGIN_ISSUER="https://smccd.onelogin.com/oidc/2"
```

**Status**: ☐ Set in Vercel (Preview)
**Environment**: Preview only
**Notes**:
- Uses DEV OneLogin application
- Already committed in `.env.development`
- Redirect URI in OneLogin: `https://*.vercel.app/api/auth/callback/onelogin`

#### Production Environment:
```bash
ONELOGIN_CLIENT_ID="your-prod-client-id"
ONELOGIN_CLIENT_SECRET="your-prod-client-secret"
ONELOGIN_ISSUER="https://smccd.onelogin.com/oidc/2"
```

**Status**: ☐ Set in Vercel (Production)
**Environment**: Production only
**Notes**:
- Uses separate PROD OneLogin application
- Redirect URI in OneLogin: `https://doorcard.smccd.edu/api/auth/callback/onelogin`
- **DO NOT USE DEV CREDENTIALS IN PRODUCTION**

---

### 4. Sentry Error Monitoring (Optional but Recommended)

```bash
SENTRY_DSN="https://xxx@xxx.ingest.us.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.us.sentry.io/xxx"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

**Status**: ☐ Set in Vercel
**Environment**: Production, Preview
**Notes**:
- Required for error tracking and monitoring
- `SENTRY_AUTH_TOKEN` needed for source map uploads
- Can skip for initial UAT if not configured

---

### 5. Microsoft Clarity Analytics (Optional)

```bash
NEXT_PUBLIC_CLARITY_ID="your-clarity-project-id"
```

**Status**: ☐ Set in Vercel
**Environment**: Production, Preview
**Notes**:
- Used for user behavior analytics
- Can skip for initial UAT if not configured

---

### 6. Feature Flags

#### Preview/UAT Environment:
```bash
NEXT_PUBLIC_SHOW_BETA_BANNER="true"
ENABLE_RATE_LIMITING="false"
ENABLE_AUTH_DEBUG="true"
LOG_LEVEL="debug"
```

**Status**: ☐ Set in Vercel (Preview)
**Environment**: Preview only
**Notes**:
- Shows beta banner for UAT testing
- Verbose logging for debugging
- Rate limiting disabled for testing

#### Production Environment:
```bash
NEXT_PUBLIC_SHOW_BETA_BANNER="false"
ENABLE_RATE_LIMITING="true"
ENABLE_AUTH_DEBUG="false"
LOG_LEVEL="error"
```

**Status**: ☐ Set in Vercel (Production)
**Environment**: Production only
**Notes**:
- Beta banner hidden in production
- Rate limiting enabled for security
- Error-only logging for performance

---

### 7. Fallback Term Configuration

```bash
FALLBACK_ACTIVE_TERM_SEASON="FALL"
FALLBACK_ACTIVE_TERM_YEAR="2025"
```

**Status**: ☐ Set in Vercel
**Environment**: Production, Preview
**Notes**:
- Used when no database term is active
- Can be set in both environments

---

## Environment-Specific Settings

### Preview Deployments (upgrade/nextjs-16 branch)

**Purpose**: UAT testing with DEV OneLogin

**Required Variables**:
- ✅ `DATABASE_URL` (SQLite or preview DB)
- ✅ `NEXTAUTH_URL` (auto-set by Vercel)
- ✅ `NEXTAUTH_SECRET` (can reuse dev secret for preview)
- ✅ `ONELOGIN_CLIENT_ID` (DEV app)
- ✅ `ONELOGIN_CLIENT_SECRET` (DEV app)
- ✅ `ONELOGIN_ISSUER`
- ✅ `NEXT_PUBLIC_SHOW_BETA_BANNER="true"`
- ✅ `ENABLE_RATE_LIMITING="false"`
- ✅ `LOG_LEVEL="debug"`

**OneLogin Redirect URI**:
```
https://next-doorcard-git-upgrade-nextjs-16-bryan-besnyis-projects.vercel.app/api/auth/callback/onelogin
https://*.vercel.app/api/auth/callback/onelogin  (wildcard)
```

### Production Deployment (main branch)

**Purpose**: Production with PROD OneLogin

**Required Variables**:
- ✅ `DATABASE_URL` (PostgreSQL production)
- ✅ `NEXTAUTH_URL` (https://doorcard.smccd.edu)
- ✅ `NEXTAUTH_SECRET` (production secret)
- ✅ `ONELOGIN_CLIENT_ID` (PROD app)
- ✅ `ONELOGIN_CLIENT_SECRET` (PROD app)
- ✅ `ONELOGIN_ISSUER`
- ✅ `NEXT_PUBLIC_SHOW_BETA_BANNER="false"`
- ✅ `ENABLE_RATE_LIMITING="true"`
- ✅ `LOG_LEVEL="error"`

**OneLogin Redirect URI**:
```
https://doorcard.smccd.edu/api/auth/callback/onelogin
```

---

## How to Set Environment Variables in Vercel

### Via Vercel Dashboard:

1. Go to https://vercel.com/bryan-besnyis-projects/next-doorcard
2. Click **Settings** → **Environment Variables**
3. Add each variable with appropriate environments:
   - **Production**: Check "Production" only
   - **Preview**: Check "Preview" only
   - **All**: Check both if same value for both

### Via Vercel CLI:

```bash
# Set for preview
vercel env add NEXT_PUBLIC_SHOW_BETA_BANNER preview
# Enter: true

# Set for production
vercel env add NEXT_PUBLIC_SHOW_BETA_BANNER production
# Enter: false

# Pull env vars to local
vercel env pull .env.local
```

---

## Verification Checklist

### Before UAT (Preview Deployment):

- [ ] Verify Vercel build succeeded (green checkmark)
- [ ] Check deployment URL: `https://next-doorcard-git-upgrade-nextjs-16-*.vercel.app`
- [ ] Verify beta banner shows on homepage
- [ ] Test OneLogin login flow
- [ ] Check browser console for errors
- [ ] Verify security headers present
- [ ] Test creating a doorcard

### Before Production Deployment:

- [ ] Verify all production env vars set
- [ ] Beta banner is hidden (`NEXT_PUBLIC_SHOW_BETA_BANNER="false"`)
- [ ] Rate limiting enabled (`ENABLE_RATE_LIMITING="true"`)
- [ ] Production database connected
- [ ] PROD OneLogin credentials configured
- [ ] Sentry error tracking working
- [ ] Custom domain configured
- [ ] SSL certificate valid

---

## Common Issues & Fixes

### Issue 1: "Configuration Error" on Login

**Cause**: OneLogin credentials not set or incorrect

**Fix**:
```bash
# Verify these are set in Vercel:
ONELOGIN_CLIENT_ID
ONELOGIN_CLIENT_SECRET
ONELOGIN_ISSUER
```

### Issue 2: Redirect URI Mismatch

**Cause**: OneLogin app doesn't have Vercel URL in redirect URIs

**Fix**: Add to OneLogin app configuration:
- Preview: `https://*.vercel.app/api/auth/callback/onelogin`
- Production: `https://doorcard.smccd.edu/api/auth/callback/onelogin`

### Issue 3: Database Connection Error

**Cause**: `DATABASE_URL` not set or invalid

**Fix**:
```bash
# Verify DATABASE_URL format:
# PostgreSQL: postgresql://user:pass@host:5432/dbname
# SQLite (dev): file:./prisma/dev.db
```

### Issue 4: Beta Banner Not Showing

**Cause**: `NEXT_PUBLIC_SHOW_BETA_BANNER` not set or wrong value

**Fix**:
```bash
# Set in Vercel (Preview environment):
NEXT_PUBLIC_SHOW_BETA_BANNER="true"

# Must rebuild after setting:
vercel --prod  # or let git push trigger rebuild
```

### Issue 5: Build Fails with "Missing Environment Variable"

**Cause**: Required env var not set during build

**Fix**: Check build logs for missing variable name, add in Vercel settings

---

## Environment Variables Summary

| Variable | Preview | Production | Required | Default |
|----------|---------|------------|----------|---------|
| `DATABASE_URL` | SQLite or preview DB | PostgreSQL | ✅ Yes | - |
| `NEXTAUTH_URL` | Auto-set | Auto-set | ✅ Yes | - |
| `NEXTAUTH_SECRET` | Dev secret OK | Prod secret | ✅ Yes | - |
| `ONELOGIN_CLIENT_ID` | DEV app | PROD app | ✅ Yes | - |
| `ONELOGIN_CLIENT_SECRET` | DEV app | PROD app | ✅ Yes | - |
| `ONELOGIN_ISSUER` | Same | Same | ✅ Yes | - |
| `SENTRY_DSN` | Optional | Recommended | ⚠️ Optional | - |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Recommended | ⚠️ Optional | - |
| `SENTRY_AUTH_TOKEN` | Optional | Recommended | ⚠️ Optional | - |
| `NEXT_PUBLIC_CLARITY_ID` | Optional | Optional | ❌ No | - |
| `NEXT_PUBLIC_SHOW_BETA_BANNER` | `"true"` | `"false"` | ✅ Yes | `"false"` |
| `ENABLE_RATE_LIMITING` | `"false"` | `"true"` | ✅ Yes | `"false"` |
| `ENABLE_AUTH_DEBUG` | `"true"` | `"false"` | ❌ No | `"false"` |
| `LOG_LEVEL` | `"debug"` | `"error"` | ❌ No | `"error"` |
| `FALLBACK_ACTIVE_TERM_SEASON` | `"FALL"` | `"FALL"` | ❌ No | `"FALL"` |
| `FALLBACK_ACTIVE_TERM_YEAR` | `"2025"` | `"2025"` | ❌ No | Current year |

---

## Next Steps

1. **Verify Vercel Build Status**:
   - Check https://vercel.com/bryan-besnyis-projects/next-doorcard/deployments
   - Look for green checkmark on latest deployment

2. **Test Preview Deployment**:
   - Open preview URL
   - Verify beta banner shows
   - Test login with DEV OneLogin
   - Create a test doorcard

3. **Review Environment Variables**:
   - Go to Vercel Settings → Environment Variables
   - Verify all required variables are set
   - Check environment-specific values (Preview vs Production)

4. **Update OneLogin Redirect URIs**:
   - Log in to OneLogin admin portal
   - Find DEV application
   - Add Vercel preview URL to redirect URIs
   - Save and test

5. **Monitor First Deployment**:
   - Check Vercel logs for errors
   - Test all critical workflows
   - Verify no console errors in browser
   - Check Sentry for any runtime errors

---

**Generated By**: Claude Code
**Date**: 2025-11-11
**Purpose**: Vercel deployment verification for UAT
