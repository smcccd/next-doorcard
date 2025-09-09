# Documentation TLDR

## Project Overview

**Next Doorcard** - SMCCD Faculty Office Hours Management System

- Next.js 15 + React 19 + TypeScript + Prisma + PostgreSQL
- Multi-college system (Skyline, CSM, Cañada, District Office)
- Faculty office hours display and management
- Recently underwent major data migration from Access database

## Quick Reference Guide

### 🏗️ **Architecture & Technical Stack**

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Prisma ORM, PostgreSQL (Neon), NextAuth v4
- **Testing**: Vitest (migrating from Jest), Cypress, Storybook
- **Infrastructure**: Vercel deployment, GitHub Actions CI/CD

### 🔒 **Authentication & Authorization**

- NextAuth v4 with Prisma adapter
- Google OAuth for educational district (@smccd.edu)
- OneLogin OIDC integration available
- Role-based access (FACULTY, ADMIN, STAFF)

### 🧪 **Testing Strategy**

- **Unit Tests**: Vitest + React Testing Library (50% migrated from Jest)
- **E2E Tests**: Cypress with accessibility testing (cypress-axe)
- **Component Testing**: Storybook for UI documentation
- **Accessibility**: WCAG 2.1 AA compliance required (educational institution)

### 📊 **Data Migration Journey**

**Problem**: Homepage showing corrupted names ("Bes Nyib" instead of proper
names) **Root Cause**: Faulty dev script created 9,627 corrupted records
**Solution**: Enterprise-grade migration from legacy Access database

- 2,271 users migrated
- 2,111 doorcards (deduplicated)
- 93,484 appointments (filtered orphans)

## Current Status (January 2025)

### ✅ **Completed**

- Root cause analysis and data corruption fix
- Legacy Access database migration pipeline
- Homepage performance optimization (5-minute caching)
- UI redesign (table-like faculty grid)
- TypeScript/build errors resolved
- Documentation organization and cleanup

### 🚧 **In Progress**

- Production database migration to Neon PostgreSQL
- Jest → Vitest migration (50% complete)
- WCAG accessibility compliance validation

### 📋 **Pending**

- Complete Vitest test migration
- Accessibility audit and VPAT generation
- User training and rollout planning

## Key Files & Directories

### 📁 **Active Documentation** (`docs/`)

- `ARCHITECTURE.md` - System design overview
- `TESTING.md` - Testing strategy & best practices
- `AUTH-PATTERNS.md` - Authentication implementation
- `ACCESSIBILITY_TESTING_GUIDE.md` - WCAG compliance
- `CI_CD_GUIDE.md` - Pipeline management
- `STORYBOOK.md` - Component development

### 📁 **Archived Documentation** (`docs/archive/`)

- Migration strategies and analysis
- Data quality reports
- Meeting summaries and decision records
- Historical production deployment plans

### 🚀 **Critical Scripts**

- `scripts/legacy-to-production.ts` - Main migration script
- `scripts/validate-migration.ts` - Data validation
- `npm run dev` - Development server (safe mode)
- `npm run test:ci` - CI test runner

## Quick Start Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Production build
npm run type-check         # TypeScript validation
npm run lint               # Code linting

# Testing
npm test                   # Unit tests
npm run test:ci           # CI tests
npm run test:e2e          # Cypress E2E tests
npm run storybook         # Component docs

# Migration (Production)
npx ts-node scripts/legacy-to-production.ts
```

## Emergency Contacts & Support

### 🚨 **Production Issues**

- Database: Migration scripts in `/scripts/`
- Performance: Homepage caching implemented
- Authentication: NextAuth + Google OAuth
- Rollback: Git history + database backups

### 📧 **Key Stakeholders**

- **Development**: [Your team]
- **Operations**: SMCCD IT Department
- **Users**: Faculty across 3 colleges
- **Management**: Quarterly accessibility reports required

## Success Metrics

### 📈 **Performance**

- Homepage load time: <2 seconds (cached)
- Database queries: Optimized with Prisma
- Error rate: <1% target

### 📊 **Adoption**

- User registration rate
- Office hours completion rate
- Cross-college usage analytics

### ♿ **Compliance**

- WCAG 2.1 AA accessibility
- Quarterly VPAT reports
- Screen reader compatibility

---

## Next Actions

1. **Complete production migration** (DATABASE_URL configured)
2. **Validate migrated data** (scripts ready)
3. **Deploy to production** (Vercel pipeline ready)
4. **Monitor adoption** (analytics in place)
5. **Generate accessibility report** (VPAT system ready)
