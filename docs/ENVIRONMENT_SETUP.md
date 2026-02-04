# Environment Configuration Guide

This guide explains how to manage environment-specific configuration for the
Faculty Doorcard application across **development**, **preview**, and
**production** environments.

## Table of Contents

- [Overview](#overview)
- [Environment Files](#environment-files)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [OneLogin SSO Configuration](#onelogin-sso-configuration)
- [Feature Flags](#feature-flags)
- [Vercel Deployment](#vercel-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses a multi-environment configuration system that supports:

- **Local Development** - Localhost with DEV OneLogin
- **Preview Deployments** - Vercel preview branches with DEV OneLogin
- **Production** - Live environment with PROD OneLogin

Each environment has:

- Separate OneLogin SSO applications
- Different database connections
- Environment-specific logging levels
- Conditional feature flags

## Environment Files

### File Structure

```
.env                    # Base configuration (Git-tracked)
.env.development        # Development settings (Git-tracked)
.env.production         # Production settings (Git-tracked, no secrets)
.env.local              # Personal overrides (Git-ignored, NOT committed)
.env.example            # Template for new developers (Git-tracked)
```

### Priority Order

Next.js loads environment files in this order (later files override earlier
ones):

1. `.env` - Loaded in all environments
2. `.env.development` or `.env.production` - Loaded based on NODE_ENV
3. `.env.local` - Personal overrides (highest priority)

## Quick Start

### First-Time Setup

1. **Copy the example file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your credentials:**

   ```bash
   # Required: Add your OneLogin DEV credentials
   ONELOGIN_CLIENT_ID="your-dev-client-id"
   ONELOGIN_CLIENT_SECRET="your-dev-client-secret"

   # Required: Generate a NextAuth secret
   NEXTAUTH_SECRET="$(openssl rand -base64 32)"
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

### For Existing Developers

If `.env.development` already has team credentials:

```bash
npm run dev
```

That's it! The application will use the committed DEV credentials.

## Environment Variables

### Required Variables

| Variable                 | Description                | Example                                 |
| ------------------------ | -------------------------- | --------------------------------------- |
| `DATABASE_URL`           | Database connection string | `file:./prisma/dev.db`                  |
| `NEXTAUTH_URL`           | Application URL            | `http://localhost:3000`                 |
| `NEXTAUTH_SECRET`        | Auth encryption key        | Generate with `openssl rand -base64 32` |
| `ONELOGIN_CLIENT_ID`     | OneLogin app client ID     | From OneLogin dashboard                 |
| `ONELOGIN_CLIENT_SECRET` | OneLogin app secret        | From OneLogin dashboard                 |

### Optional Variables

| Variable                       | Description            | Default                       |
| ------------------------------ | ---------------------- | ----------------------------- |
| `LOG_LEVEL`                    | Logging verbosity      | `debug` (dev), `error` (prod) |
| `NEXT_PUBLIC_SHOW_BETA_BANNER` | Show beta banner       | `true` (dev), `false` (prod)  |
| `ENABLE_RATE_LIMITING`         | Enable API rate limits | `false` (dev), `true` (prod)  |
| `ENABLE_AUTH_DEBUG`            | Verbose auth logging   | `true` (dev), `false` (prod)  |
| `NEXTAUTH_DEBUG`               | NextAuth debug mode    | `true` (dev), `false` (prod)  |

### Environment-Specific Defaults

The application automatically adjusts settings based on the environment:

**Development:**

- Log Level: `debug`
- Beta Banner: Visible
- Rate Limiting: Disabled
- Auth Debug: Enabled

**Production:**

- Log Level: `error`
- Beta Banner: Hidden
- Rate Limiting: Enabled
- Auth Debug: Disabled

## OneLogin SSO Configuration

### Two Separate Applications

You must configure **two separate OneLogin applications**:

1. **DEV Application** - For local development and preview deployments
2. **PROD Application** - For production environment only

### DEV OneLogin Setup

1. Go to OneLogin Admin > Applications
2. Create/select your **DEV** OIDC application
3. Configure redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/onelogin
   https://your-preview-url.vercel.app/api/auth/callback/onelogin
   ```
4. Copy Client ID and Client Secret to `.env.development`

### PROD OneLogin Setup

1. Create a **separate** OIDC application for production
2. Configure redirect URI:
   ```
   https://doorcard.smccd.edu/api/auth/callback/onelogin
   ```
3. Set Client ID and Client Secret in **Vercel Production** environment
   variables

### Why Separate Applications?

- **Security** - Production credentials never used in development
- **Isolation** - DEV/PROD data never mixed
- **Compliance** - Audit trails separate per environment
- **Flexibility** - Different access policies per environment

## Feature Flags

Feature flags allow enabling/disabling features without code changes.

### Available Flags

| Flag                           | Description                  | Control              |
| ------------------------------ | ---------------------------- | -------------------- |
| `NEXT_PUBLIC_SHOW_BETA_BANNER` | Display pre-prod beta banner | Environment variable |
| `ENABLE_RATE_LIMITING`         | Enable API rate limiting     | Environment variable |
| `ENABLE_AUTH_DEBUG`            | Verbose authentication logs  | Environment variable |

### Using Feature Flags in Code

```typescript
import { featureFlags } from "@/lib/feature-flags";

// Check if feature is enabled
if (featureFlags.showBetaBanner) {
  // Show beta banner
}

// Get environment-specific value
import { getEnvironmentValue } from "@/lib/feature-flags";

const apiTimeout = getEnvironmentValue({
  development: 30000,
  preview: 15000,
  production: 10000,
  fallback: 10000,
});
```

## Vercel Deployment

### Environment Variable Setup

Configure these in Vercel Dashboard → Settings → Environment Variables:

#### Production Environment

```
DATABASE_URL=postgresql://user:pass@host:5432/doorcard
NEXTAUTH_URL=https://doorcard.smccd.edu
NEXTAUTH_SECRET=<generate-secure-secret>
ONELOGIN_CLIENT_ID=<prod-client-id>
ONELOGIN_CLIENT_SECRET=<prod-client-secret>
SENTRY_DSN=<your-sentry-dsn>
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
```

#### Preview Environment

```
DATABASE_URL=<preview-database-url>
NEXTAUTH_URL=https://your-app-git-branch.vercel.app
ONELOGIN_CLIENT_ID=<dev-client-id>
ONELOGIN_CLIENT_SECRET=<dev-client-secret>
```

#### Development Environment

Uses committed `.env.development` file (no Vercel config needed)

### Deployment Process

1. **Commit code** to your branch
2. **Vercel auto-deploys** preview
3. **Preview uses** DEV OneLogin + preview DB
4. **Merge to main** for production
5. **Production uses** PROD OneLogin + prod DB

## Troubleshooting

### OAuth "invalid_grant" Error

**Problem:** `Token request failed: 400 {"error":"invalid_grant"}`

**Solution:**

1. Check that `NEXTAUTH_URL` matches your current URL
   - Local: `http://localhost:3000`
   - Vercel: Your deployment URL
2. Verify redirect URI is configured in OneLogin
3. Ensure you're using the correct OneLogin app (DEV vs PROD)
4. Clear browser cookies and try again

### "Missing required environment variable" Error

**Problem:** App fails to start with missing variable error

**Solution:**

1. Copy `.env.example` to `.env.local`
2. Fill in all required variables
3. Run `npm run dev` again

### Beta Banner Not Showing/Hiding

**Problem:** Beta banner doesn't respect environment

**Solution:**

1. Check `NEXT_PUBLIC_SHOW_BETA_BANNER` in your env file
2. Restart dev server (Next.js bakes env vars at build time)
3. For production, set in Vercel environment variables

### Different OneLogin Credentials Per Environment

**Problem:** How do I use DEV credentials locally and PROD in production?

**Solution:**

1. Put DEV credentials in `.env.development` (committed)
2. Put PROD credentials in Vercel Production environment variables
3. Never commit PROD credentials to git
4. The app automatically selects the right credentials based on `NODE_ENV`

### Database Connection Issues

**Problem:** Can't connect to database

**Solution:**

- **Development:** Ensure `prisma/dev.db` exists (run `npx prisma generate`)
- **Production:** Verify `DATABASE_URL` in Vercel matches your database
- Check database is accessible from your environment

## Best Practices

1. **Never commit `.env.local`** - It's git-ignored for a reason
2. **Use `.env.example`** as a template for new developers
3. **Rotate secrets regularly** - Especially NEXTAUTH_SECRET and OAuth
   credentials
4. **Test in preview** before merging to production
5. **Use feature flags** instead of environment checks when possible
6. **Document changes** to environment variables in this file

## Need Help?

- Check `.env.example` for correct variable names
- Review `lib/env-config.ts` for validation logic
- Contact IT Support: itsupport@smccd.edu
- See main README.md for general setup instructions
