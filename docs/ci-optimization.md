# CI/CD Pipeline Optimization

## Overview

This document outlines the optimization of our GitHub Actions CI/CD pipeline to
reduce build times while maintaining code quality.

## Before vs After

### Original Pipeline (Sequential)

```
Setup → Lint → Unit Tests → E2E Tests → Build → Deploy
  2m     2m       3m          6m        2m      1m
Total: ~16 minutes
```

### Optimized Pipeline (Parallel)

```
Setup (2m)
├─ Lint (2m)
├─ TypeCheck (1m)
├─ Unit Tests (2m)
├─ Build (2m)
└─ E2E Tests (3m, 2 shards) → Deploy (1m)

Total: ~6 minutes (67% reduction)
```

## Key Optimizations

### 1. Dependency Caching Strategy

- **Multi-layer caching**: npm cache, node_modules, Cypress binary, Prisma
  client
- **Cache keys**: Based on package-lock.json and source file hashes
- **Artifact sharing**: Dependencies installed once, shared across jobs

### 2. Parallel Job Execution

- **Quality checks run simultaneously**: Lint, TypeCheck, Unit Tests
- **Build runs parallel**: No dependency on quality checks
- **E2E sharding**: Split across 2 runners for faster execution

### 3. Smart Cache Keys

```yaml
# Next.js cache includes source files for intelligent invalidation
key:
  ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{
  hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.json') }}

# TypeScript incremental builds cached
path: .next/cache/tsconfig.tsbuildinfo
```

### 4. E2E Test Sharding

- **Shard 1**: doorcard-management.cy.ts, dashboard.cy.ts
- **Shard 2**: public-viewing.cy.ts, form-validation.cy.ts
- **Parallel execution**: Reduces E2E time from 6m to 3m

### 5. Build Artifact Reuse

- Build once, deploy with `--prebuilt` flag
- Eliminates redundant builds in deploy step

## Performance Gains

| Metric         | Before | After | Improvement    |
| -------------- | ------ | ----- | -------------- |
| Total Time     | ~16min | ~6min | 67% reduction  |
| Cache Hit Time | ~16min | ~3min | 81% reduction  |
| E2E Tests      | 6min   | 3min  | 50% reduction  |
| Parallel Jobs  | 1      | 4-5   | 5x concurrency |

## Quality Maintained

- ✅ Same test coverage
- ✅ Same linting rules
- ✅ Same type checking
- ✅ Same E2E test scenarios
- ✅ All quality gates preserved

## Branch Protection Integration

The optimized workflow works seamlessly with branch protection:

- Pull requests run all quality checks
- Main branch deployments only after all tests pass
- Automatic Vercel deployment disabled (CI-controlled)

## Usage

1. **Pull Requests**: Full pipeline runs on all PRs
2. **Main Branch**: Deploys automatically after all checks pass
3. **Feature Branches**: Quality checks only (no deployment)

## Monitoring

Monitor pipeline performance in GitHub Actions:

- Job duration trends
- Cache hit rates
- Failure patterns by job type
- Resource usage optimization
