# CI/CD Guide for Next Doorcard

## Overview

This project uses GitHub Actions for continuous integration and Vercel for
deployment. The CI/CD pipeline ensures code quality, runs tests, and
automatically deploys to production.

## Available Workflows

### 1. **ci.yml** - Main CI/CD Pipeline

- Runs on push to `main` and `develop` branches
- Runs on pull requests to `main`
- Sequential execution with dependency caching
- Includes unit tests, E2E smoke tests, and deployment

### 2. **ci-matrix.yml** - Optimized Matrix Pipeline

- Tests against multiple Node.js versions (20, 22)
- Parallel execution for faster feedback
- Optimized caching strategy
- Lightweight smoke tests

### 3. **ci-enhanced.yml** - Enterprise Pipeline

- Advanced features like security scanning
- Performance monitoring
- Parallel test sharding
- Comprehensive reporting

## Pipeline Stages

### 1. Setup & Dependencies

- Installs Node.js dependencies
- Caches node_modules for faster builds
- Validates installation

### 2. Static Analysis

- **Linting**: `npm run lint`
- **Type Checking**: `npm run type-check`
- **Format Check**: `npm run format:check`

### 3. Unit & Integration Tests

- Runs Jest tests with coverage
- Uses PostgreSQL test database
- Coverage thresholds: 70% lines, 70% functions, 60% branches

### 4. Build

- Generates Prisma client
- Builds Next.js application
- Analyzes bundle size
- Caches build artifacts

### 5. E2E Tests

- Runs Cypress smoke tests
- Tests critical user paths
- Captures screenshots on failure

### 6. Deployment

- Deploys to Vercel on main branch
- Automatic production deployment
- Health check verification

## Environment Variables

### Required for CI:

```env
# Database (provided by GitHub Actions services)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db

# Authentication
NEXTAUTH_SECRET=test-secret
NEXTAUTH_URL=http://localhost:3000

# Build
SKIP_ENV_VALIDATION=true
```

### Required GitHub Secrets:

```env
# Vercel Deployment
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Optional
CODECOV_TOKEN
CYPRESS_RECORD_KEY
```

## Local Testing

### Run CI Tests Locally:

```bash
# Unit tests with CI config
npm run test:ci

# E2E smoke tests
npm run test:e2e -- --spec cypress/e2e/smoke.cy.ts

# Full CI simulation
npm run lint && npm run type-check && npm run test:ci && npm run build
```

### Debug CI Failures:

1. Check the workflow logs in GitHub Actions
2. Run the failing command locally
3. Use the same Node.js version as CI (v22)
4. Ensure PostgreSQL is running for tests

## Deployment

### Automatic Deployment:

- Push to `main` branch triggers deployment
- Vercel builds and deploys automatically
- Preview deployments for pull requests

### Manual Deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Deployment Configuration:

- See `vercel.json` for build settings
- Environment variables set in Vercel dashboard
- Node.js 22 runtime for API routes

## Troubleshooting

### Common Issues:

1. **E2E Tests Failing**
   - Check if the app starts correctly: `npm run start`
   - Verify database connection
   - Check for missing environment variables

2. **Build Failures**
   - Clear caches: `rm -rf .next node_modules`
   - Reinstall dependencies: `npm ci`
   - Check for TypeScript errors: `npm run type-check`

3. **Deployment Failures**
   - Verify Vercel secrets are set
   - Check build logs in Vercel dashboard
   - Ensure `vercel.json` is valid

### CI Performance Tips:

1. **Use ci.yml** for standard development
2. **Use ci-matrix.yml** for comprehensive testing
3. **Cache aggressively** to reduce install time
4. **Run tests in parallel** when possible
5. **Use smoke tests** for quick validation

## Best Practices

1. **Before Pushing:**
   - Run `npm run lint` and fix issues
   - Run `npm run type-check`
   - Run `npm test` for affected files
   - Format code: `npm run format`

2. **Writing Tests:**
   - Keep unit tests fast and isolated
   - Use test database for integration tests
   - Write E2E tests for critical paths only
   - Aim for 70%+ code coverage

3. **CI Optimization:**
   - Use `.github/workflows/ci.yml` as default
   - Enable matrix builds for release branches
   - Monitor CI execution time
   - Review and update dependencies regularly

## Monitoring

### CI Metrics:

- Average build time: ~5-7 minutes
- Test execution: ~2-3 minutes
- Deployment: ~2-3 minutes

### Health Checks:

- Production health: https://next-doorcard.vercel.app/api/health
- Monitor deployment status in Vercel dashboard
- Set up alerts for failed deployments

## Support

For CI/CD issues:

1. Check workflow logs in GitHub Actions
2. Review this guide for common solutions
3. Create an issue with CI/CD label
4. Contact the platform team for infrastructure issues
