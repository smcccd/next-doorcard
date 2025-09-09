# Production Readiness Comprehensive Plan

## 🚨 CRITICAL ISSUES TO RESOLVE

### 1. **Data Synchronization** (HIGH PRIORITY)

- [ ] Investigate production doorcard.smccd.edu data structure and export
      capabilities
- [ ] Full audit of what data exists in production vs dev, identify gaps and
      discrepancies
- [ ] Create comprehensive plan to migrate clean production data to dev
      environment

### 2. **Homepage Logic Fixes** (HIGH PRIORITY)

- [x] Fix app/page.tsx logic showing blank/incorrect recent doorcards due to
      missing term filtering
- [x] Added current term filtering to homepage query (now shows 162 Fall 2025
      doorcards)
- [x] Recent doorcards section now properly filtered by term

### 3. **Environment Management** (HIGH PRIORITY)

- [ ] Implement seamless dev/staging/prod environment switching with proper data
      isolation
- [ ] Set up proper database seeding for different environments
- [ ] Ensure production data doesn't get corrupted by dev activities

### 4. **Testing Infrastructure** (HIGH PRIORITY)

- [ ] Update all tests that were broken by data cleanup and homepage refactoring
- [ ] Fix tests expecting old corrupted data patterns
- [ ] Update component tests for new card designs
- [ ] Fix integration tests for homepage filtering

### 5. **Code Quality** (MEDIUM PRIORITY)

- [x] Run `npm run lint` and fix all linting issues
- [x] Run `npm run type-check` and resolve all TypeScript errors (core app
      issues fixed, 19 remaining in dev scripts)
- [ ] Clean up unused imports and dead code

### 6. **CI/CD Pipeline** (HIGH PRIORITY)

- [ ] Get CI/CD pipeline working with updated tests and clean codebase
- [ ] Ensure all builds pass
- [ ] Set up proper deployment process

## 🔍 INVESTIGATION NEEDED

### WebSchedule API Integration (FUTURE ENHANCEMENT)

- [ ] Analyze https://webschedule.smccd.edu/api/instructor-courses API for data
      integration potential
- API provides: Faculty info, course schedules, room assignments, email
  addresses
- Terms available: 202505 (Summer 2025), 202508 (Fall 2025)
- **NOT MVP** - focus on core functionality first

## 📋 IMMEDIATE ACTION PLAN

### Phase 1: Data & Logic Fixes

1. Fix homepage filtering logic (term-specific queries)
2. Audit production data vs dev data
3. Create clean production data migration

### Phase 2: Testing & Quality

1. Update broken tests
2. Fix lint/type errors
3. Get CI/CD working

### Phase 3: Environment Setup

1. Proper dev/staging/prod separation
2. Environment switching mechanism
3. Data isolation strategies

## 🎯 SUCCESS CRITERIA

- [ ] Homepage shows correct faculty for current term
- [ ] All tests pass
- [ ] CI/CD pipeline green
- [ ] Clean production-like data in dev
- [ ] Seamless environment switching

## 📝 NOTES

- Corrupted legacy data has been cleaned (233 bad records removed)
- Homepage filtering logic needs current term constraints
- WebSchedule API could be valuable for future real-time data
- Production data sync is critical for realistic testing

---

**Status**: Plan created, ready for execution **Priority**: Focus on Phase 1
first - data and logic fixes
