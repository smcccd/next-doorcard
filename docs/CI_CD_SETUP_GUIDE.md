# CI/CD Pipeline Setup Guide

This guide provides complete instructions for setting up the enhanced CI/CD
pipeline for the Next Doorcard project.

## Overview

The enhanced CI/CD pipeline provides:

- Automated testing (unit, integration, E2E)
- Security scanning and vulnerability checks
- Parallel job execution for faster builds
- Smart caching strategies
- Automatic deployment to Vercel
- Comprehensive error handling and notifications

## Prerequisites

Before setting up the pipeline, ensure you have:

1. A GitHub repository with admin access
2. A Vercel account and project
3. A PostgreSQL database for testing
4. OneLogin SSO application configured

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings under Settings →
Secrets and variables → Actions:

### Authentication Secrets

- **`NEXTAUTH_SECRET`**: Random string for JWT encryption
  ```bash
  # Generate with: openssl rand -base64 32
  ```
- **`NEXTAUTH_URL`**: Your production URL (e.g.,
  `https://next-doorcard.vercel.app`)

### Database

- **`DATABASE_URL`**: PostgreSQL connection string
  ```
  postgresql://user:password@host:port/database?sslmode=require
  ```

### OneLogin SSO

- **`ONELOGIN_CLIENT_ID`**: OAuth client ID from OneLogin
- **`ONELOGIN_CLIENT_SECRET`**: OAuth client secret from OneLogin
- **`ONELOGIN_ISSUER`**: OneLogin OIDC issuer URL (e.g.,
  `https://smccd.onelogin.com/oidc/2`)

### Vercel Deployment

- **`VERCEL_TOKEN`**: Personal access token from Vercel
  1. Go to https://vercel.com/account/tokens
  2. Create a new token with full access
  3. Copy and save as GitHub secret

- **`VERCEL_ORG_ID`**: Your Vercel organization ID
  1. Run `npx vercel whoami` locally
  2. Copy the org ID from the output

- **`VERCEL_PROJECT_ID`**: Your Vercel project ID
  1. Go to your project settings in Vercel
  2. Copy the project ID

### Optional Secrets

- **`CODECOV_TOKEN`**: For code coverage reporting (get from codecov.io)
- **`CYPRESS_RECORD_KEY`**: For Cypress dashboard recording
- **`SENTRY_AUTH_TOKEN`**: For error tracking (if using Sentry)

## Workflow Files

The pipeline uses three main workflow files:

1. **`.github/workflows/ci-enhanced.yml`**: Main CI/CD pipeline (recommended)
2. **`.github/workflows/ci-optimized.yml`**: Alternative optimized pipeline
3. **`.github/workflows/accessibility-vpat.yml`**: Accessibility compliance
   testing

## Pipeline Features

### 1. Change Detection

The pipeline automatically detects which files have changed and runs only
relevant jobs:

- Code changes trigger full pipeline
- Documentation changes skip tests
- Dependency changes trigger clean installs

### 2. Caching Strategy

Multi-layer caching for optimal performance:

- Node modules cache
- Cypress binary cache
- Prisma client cache
- Next.js build cache
- TypeScript incremental build cache

### 3. Parallel Execution

Jobs run in parallel where possible:

- Static analysis (lint, format, typecheck)
- Security scanning
- Unit and E2E tests

### 4. Test Sharding

E2E tests are split across multiple runners for faster execution.

### 5. Deployment Safety

- Only deploys from main branch
- Requires all tests to pass
- Performs health checks after deployment
- Supports rollback via `[skip deploy]` commit message

## Local Setup

To test the pipeline locally:

1. **Install Act** (GitHub Actions local runner):

   ```bash
   brew install act  # macOS
   # or
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux
   ```

2. **Create `.env` file for Act**:

   ```bash
   # .env.act
   GITHUB_TOKEN=your_github_token
   NEXTAUTH_SECRET=test-secret
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test
   ```

3. **Run specific jobs locally**:

   ```bash
   # Run linting
   act -j static-analysis -e .github/workflows/ci-enhanced.yml

   # Run unit tests
   act -j test-unit -e .github/workflows/ci-enhanced.yml
   ```

## Troubleshooting

### Common Issues

1. **Cache misses**
   - Check if package-lock.json has changed
   - Verify cache key generation in logs
   - Clear caches in GitHub Actions settings if needed

2. **Database connection failures**
   - Ensure DATABASE_URL is correctly formatted
   - Check PostgreSQL service is running in CI
   - Verify SSL settings match your database

3. **Vercel deployment failures**
   - Verify all Vercel secrets are correct
   - Check Vercel project settings
   - Ensure build command matches vercel.json

4. **E2E test failures**
   - Check Cypress screenshots/videos in artifacts
   - Verify wait-on URL is accessible
   - Increase timeout if needed

### Debugging Steps

1. **Enable debug logging**:

   ```yaml
   env:
     ACTIONS_STEP_DEBUG: true
     ACTIONS_RUNNER_DEBUG: true
   ```

2. **Add tmate debugging** (for interactive debugging):

   ```yaml
   - name: Setup tmate session
     uses: mxschmitt/action-tmate@v3
     if: ${{ failure() }}
   ```

3. **Check specific job logs**:
   - Click on the failed job in GitHub Actions
   - Expand each step to see detailed logs
   - Download artifacts for screenshots/videos

## Maintenance

### Regular Tasks

1. **Update dependencies monthly**:
   - Run `npm update` locally
   - Test thoroughly
   - Update cache keys if major changes

2. **Review and optimize caching**:
   - Monitor cache hit rates
   - Adjust cache keys for better hits
   - Remove unused caches

3. **Monitor pipeline performance**:
   - Track job execution times
   - Identify bottlenecks
   - Optimize slow jobs

4. **Security updates**:
   - Keep GitHub Actions versions updated
   - Review npm audit regularly
   - Update secrets periodically

### Best Practices

1. **Commit messages**:
   - Use `[skip ci]` to skip pipeline
   - Use `[skip deploy]` to skip deployment
   - Be descriptive for better debugging

2. **Branch protection**:
   - Require PR reviews
   - Require status checks to pass
   - Dismiss stale reviews

3. **Secret management**:
   - Rotate secrets quarterly
   - Use least privilege principle
   - Document secret purposes

## Monitoring

### GitHub Actions Dashboard

- Monitor workflow runs at: `https://github.com/[org]/[repo]/actions`
- Set up notifications for failures
- Review execution trends

### Metrics to Track

- Pipeline success rate
- Average execution time
- Cache hit rates
- Test pass rates
- Deployment frequency

### Alerts

Configure alerts for:

- Pipeline failures on main branch
- Security vulnerabilities
- Long-running jobs
- Repeated failures

## Cost Optimization

GitHub Actions usage:

- Free tier: 2,000 minutes/month
- Monitor usage in Settings → Billing
- Optimize by:
  - Using efficient caching
  - Running jobs in parallel
  - Skipping unnecessary jobs
  - Using matrix strategy wisely

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review GitHub Actions logs
3. Create an issue with the `ci-cd` label
4. Contact the DevOps team

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
