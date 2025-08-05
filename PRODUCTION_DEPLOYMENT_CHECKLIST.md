# Production Deployment Checklist

## Next Doorcard - Educational District Application

### Pre-Deployment Verification ✅

#### Code Quality & Testing

- [x] **Critical business logic tested** (100% coverage on utilities, 96%+ on
      database operations)
- [x] **Authentication & authorization tested** (76% coverage on critical paths)
- [x] **Database operations tested** (term management, error handling, user
      management)
- [x] **TypeScript compilation passes** (`npm run type-check`)
- [x] **Linting passes** (`npm run lint`)
- [x] **All tests pass** (`npm test`)

#### WCAG Accessibility Compliance ⚠️ REQUIRED FOR EDUCATIONAL DISTRICT

- [x] **Comprehensive accessibility testing setup** (cypress-axe installed and
      configured)
- [x] **Quarterly VPAT generation configured** (runs automatically every
      quarter)
- [ ] **Manual accessibility verification completed**
  - [ ] Screen reader testing (VoiceOver/NVDA)
  - [ ] Keyboard-only navigation testing
  - [ ] Color contrast verification (4.5:1 ratio minimum)
  - [ ] Focus indicators visible and logical
- [ ] **Automated accessibility tests passing**
  - [ ] WCAG 2.1 Level AA compliance on all major pages
  - [ ] Form accessibility (proper labels, error handling)
  - [ ] Navigation landmarks and heading structure
  - [ ] Mobile accessibility and touch targets
- [ ] **VPAT (Voluntary Product Accessibility Template) ready**
  - [x] Automated quarterly VPAT generation (Jan 1, Apr 1, Jul 1, Oct 1)
  - [x] Manual VPAT generation script (`npm run vpat:generate`)
  - [x] API endpoint for VPAT access (`/api/accessibility/vpat`)
  - [x] 7-year retention policy for district compliance
  - [ ] Current quarter VPAT generated and filed with district
- [ ] **Accessibility documentation prepared**
  - [x] WCAG compliance statement template
  - [x] Alternative access methods documented
  - [x] User accessibility guide created

#### Environment Configuration

- [ ] **Production environment variables configured**
  - [ ] `DATABASE_URL` (production PostgreSQL)
  - [ ] `NEXTAUTH_SECRET` (secure random string)
  - [ ] `NEXTAUTH_URL` (production domain)
  - [ ] `NEXT_PUBLIC_APP_URL` (production domain)
  - [ ] Email provider settings (if using email authentication)
- [ ] **Database migration ready**
  - [ ] Production database created
  - [ ] Migration scripts tested in staging
  - [ ] Database backup plan in place
- [ ] **SSL certificate configured**
- [ ] **Domain name configured and DNS propagated**

#### Security Checklist

- [ ] **Authentication provider configured** (Google/Microsoft for district)
- [ ] **CORS settings appropriate for production**
- [ ] **Rate limiting configured** (if applicable)
- [ ] **Error logging configured** (but not exposing sensitive data)
- [ ] **Admin routes properly protected** (`/admin` requires appropriate
      permissions)

### Deployment Platform Preparation

#### Vercel Deployment (Recommended)

- [ ] **Vercel project connected to GitHub repository**
- [ ] **Environment variables set in Vercel dashboard**
- [ ] **Build and deployment settings configured**
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `.next`
  - [ ] Install command: `npm install`
- [ ] **Custom domain configured** (if using district domain)
- [ ] **Preview deployments tested**

#### Alternative: Self-Hosted

- [ ] **Server requirements met**
  - [ ] Node.js 18+ installed
  - [ ] PostgreSQL database accessible
  - [ ] SSL certificate installed
  - [ ] Reverse proxy configured (nginx/Apache)
- [ ] **Process management** (PM2, systemd, or Docker)
- [ ] **Backup strategy** for database and uploaded files
- [ ] **Monitoring and logging** setup

### Database Setup

- [ ] **Production database created**
- [ ] **Database user with appropriate permissions**
- [ ] **Connection string tested**
- [ ] **Prisma migrations applied** (`npx prisma migrate deploy`)
- [ ] **Database seeding completed** (if required)
  - [ ] Academic terms created
  - [ ] Initial admin users
  - [ ] Department data populated

### Post-Deployment Verification

#### Functional Testing

- [ ] **Application loads successfully**
- [ ] **Authentication works** (test with district Google/Microsoft accounts)
- [ ] **Database connectivity confirmed**
- [ ] **File uploads work** (if applicable)
- [ ] **Email notifications work** (if configured)

#### Admin Functionality

- [ ] **Admin panel accessible** (`/admin`)
- [ ] **User management works**
- [ ] **Term management works**
- [ ] **Analytics/reporting functions**

#### Core User Workflows

- [ ] **User registration/login**
- [ ] **Profile creation and editing**
- [ ] **Doorcard creation and editing**
- [ ] **Public doorcard viewing**
- [ ] **Search and filtering**

### Monitoring & Maintenance Setup

#### Logging & Monitoring

- [ ] **Application logs configured**
- [ ] **Error tracking setup** (Sentry integration available)
- [ ] **Database performance monitoring**
- [ ] **Uptime monitoring**
- [ ] **SSL certificate expiration monitoring**

#### Backup & Recovery

- [ ] **Database backup automation**
- [ ] **Backup restoration tested**
- [ ] **Recovery procedures documented**

#### Performance

- [ ] **Page load times acceptable** (<2s for main pages)
- [ ] **Database query performance acceptable**
- [ ] **CDN configured** (if needed for static assets)

### User Rollout Strategy

#### Phase 1: Pilot Department (Week 1)

- [ ] **Select pilot department** (IT or willing early adopters)
- [ ] **Pilot users trained** on basic functionality
- [ ] **Feedback collection method established**
- [ ] **Support contact information provided**

#### Phase 2: Gradual Rollout (Weeks 2-4)

- [ ] **Department-by-department rollout plan**
- [ ] **User training materials prepared**
  - [ ] Quick start guide
  - [ ] Video tutorials (optional)
  - [ ] FAQ document
- [ ] **Support ticket system** or email established

#### Phase 3: Full Deployment (Week 4+)

- [ ] **All faculty have access**
- [ ] **Usage analytics tracking**
- [ ] **Regular feedback collection**

### Emergency Procedures

- [ ] **Rollback plan documented**
- [ ] **Emergency contacts list**
- [ ] **Database backup accessible**
- [ ] **Maintenance page ready** (if needed)

### Success Metrics

- [ ] **User adoption rate tracking**
- [ ] **Error rate monitoring** (<1% error rate target)
- [ ] **User satisfaction feedback**
- [ ] **Performance metrics baseline**

### Documentation

- [ ] **User documentation updated**
- [ ] **Admin documentation prepared**
- [ ] **Technical documentation current**
- [ ] **Support procedures documented**

---

## Quick Start Commands

### Final Pre-Deployment Test

```bash
# Run all quality checks
npm run type-check
npm run lint
npm test

# Test production build locally
npm run build
npm start
```

### Quarterly VPAT Generation Commands

```bash
# Generate VPAT manually (for immediate needs)
npm run vpat:generate

# Run accessibility tests and generate VPAT
npm run accessibility:report

# Access current VPAT via API
curl http://localhost:3000/api/accessibility/vpat

# Download VPAT files for district filing
curl http://localhost:3000/api/accessibility/vpat/download?format=html
curl http://localhost:3000/api/accessibility/vpat/download?format=json

# Trigger quarterly VPAT generation manually (via GitHub)
gh workflow run "Accessibility Testing and VPAT Generation"
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Database Migration (Production)

```bash
# Apply migrations to production database
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

---

## Support Information

**Technical Support:** [Your IT Department Contact] **Application Issues:**
[Your Email/Ticket System] **Training Resources:** [Link to
documentation/tutorials]

**Emergency Contacts:**

- Database Issues: [DBA Contact]
- Server Issues: [Infrastructure Team]
- Application Issues: [Development Team]

---

_Last Updated: [Current Date]_ _Prepared for: [Your Educational District Name]_
