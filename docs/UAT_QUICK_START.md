# UAT Quick Start Guide - Tomorrow 2025-11-12

## ✅ Pre-UAT Status: READY

**Completed**:
- ✅ Console.log statements cleaned up
- ✅ Database schema synced
- ✅ Beta banner configured
- ✅ Security headers verified
- ✅ Next.js 16 upgrade complete
- ✅ Comprehensive UAT report generated

**Current State**:
- Dev server running: http://localhost:3000
- Database: 51 users, 52 doorcards, 0 terms
- Branch: `upgrade/nextjs-16`
- Build status: ✓ Passing (6.4s)

---

## 🚀 Launch UAT in 3 Steps (5 minutes)

### Step 1: Create UAT Term (2 min)

```bash
# 1. Open admin dashboard
open http://localhost:3000/admin

# 2. Navigate to Terms tab
# 3. Click "Create New Term"
# 4. Fill in form:
#    - Name: Fall 2025
#    - Season: Fall
#    - Year: 2025
#    - Start Date: 2025-08-18
#    - End Date: 2025-12-15
# 5. Click "Create Term"
# 6. Click "Activate" button on the new term
```

### Step 2: Verify Login (2 min)

```bash
# 1. Open login page
open http://localhost:3000/login

# 2. Click "Sign in with OneLogin"
# 3. Enter your SMCCD credentials
# 4. Should redirect to dashboard after successful login
```

**If login fails**:
- Check OneLogin DEV app has redirect URI: `http://localhost:3000/api/auth/callback/onelogin`
- Verify credentials in `.env.development` match OneLogin app
- Check browser console for error details

### Step 3: Verify Beta Banner (1 min)

```bash
# 1. Navigate to dashboard
open http://localhost:3000/dashboard

# 2. Verify orange banner shows:
#    "Pre-Production Beta Testing Environment"
#    "Your feedback helps us improve before launch!"
```

**Done!** You're ready for UAT.

---

## 📋 Critical UAT Test Scenarios

### Scenario 1: Complete Doorcard Workflow (10 min)

```
1. Log in to dashboard
2. Click "Create New Doorcard"
3. Step 1: Select campus and Fall 2025 term
4. Step 2: Fill in basic info (name, office, subtitle)
5. Step 3: Add 3+ time blocks with different categories
   - Test conflict detection (add overlapping times)
6. Step 4: Preview and publish
7. View public doorcard in new tab
8. Return to dashboard, verify doorcard shows as "Live"
9. Edit doorcard, change office location
10. Delete doorcard with confirmation
```

**Expected**: All steps complete without errors

### Scenario 2: Admin Operations (5 min)

```
1. Navigate to /admin
2. Overview Tab: Verify statistics display
3. Users Tab: Search for a user by email
4. Doorcards Tab: Filter by campus
5. Terms Tab: View term list with Fall 2025 active
6. Try archiving Fall 2025 (should show confirmation)
7. Cancel archiving
```

**Expected**: All admin features functional

### Scenario 3: Mobile Experience (5 min)

```
1. Open DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M)
3. Select "iPhone 14 Pro"
4. Navigate through:
   - Dashboard (verify grid layout)
   - Create doorcard (verify form fields)
   - Mobile menu (hamburger icon)
5. Test touch interactions
```

**Expected**: Responsive layouts, touch-friendly

### Scenario 4: Error Handling (5 min)

```
1. Try to create doorcard without filling required fields
   Expected: Validation errors show

2. Try to add overlapping time blocks
   Expected: Conflict warning displays

3. Try to access another user's doorcard edit URL
   Expected: 403 Forbidden or redirect

4. Log out and try to access /admin
   Expected: Redirect to login
```

**Expected**: Graceful error handling throughout

---

## 🐛 Common UAT Issues & Fixes

### Issue 1: Can't Log In

**Symptoms**: Redirect loop, "invalid_grant" error, stuck on login page

**Fix**:
```bash
# 1. Verify OneLogin configuration
cat .env.development | grep ONELOGIN

# 2. Check redirect URI in OneLogin app settings
# Should be: http://localhost:3000/api/auth/callback/onelogin

# 3. Clear browser cookies and try again
# Chrome: Cmd+Shift+Delete → Cookies → Clear

# 4. Check dev server logs for error details
```

### Issue 2: Beta Banner Not Showing

**Symptoms**: Orange banner doesn't appear on dashboard

**Fix**:
```bash
# 1. Verify environment variable
cat .env.development | grep BETA_BANNER
# Should be: NEXT_PUBLIC_SHOW_BETA_BANNER="true"

# 2. Restart dev server
lsof -ti:3000 | xargs kill
npm run dev

# 3. Hard refresh browser (Cmd+Shift+R)
```

### Issue 3: No Terms Available

**Symptoms**: Can't create doorcard, no term dropdown options

**Fix**:
```bash
# Create a term via admin dashboard (see Step 1 above)
# OR use Prisma Studio:

npx prisma studio
# http://localhost:5555
# Navigate to Term model
# Click "Add record"
# Fill in fields and activate
```

### Issue 4: Database Connection Error

**Symptoms**: "Can't connect to database" error

**Fix**:
```bash
# 1. Verify database exists
ls -la prisma/dev.db
# Should show ~286KB file

# 2. Sync schema
npx prisma db push

# 3. Regenerate Prisma client
npx prisma generate

# 4. Restart dev server
```

---

## 📊 UAT Metrics to Collect

### Performance Metrics
- [ ] Time to create new doorcard: _____ seconds
- [ ] Time to load dashboard: _____ seconds
- [ ] Time to publish doorcard: _____ seconds
- [ ] Mobile performance feels: ☐ Fast ☐ Acceptable ☐ Slow

### Usability Metrics
- [ ] Number of errors encountered: _____
- [ ] Number of confusing UI elements: _____
- [ ] Number of helpful features discovered: _____
- [ ] Overall satisfaction (1-5): _____

### Feature Completeness
- [ ] Can create doorcard: ☐ Yes ☐ No
- [ ] Can edit doorcard: ☐ Yes ☐ No
- [ ] Can delete doorcard: ☐ Yes ☐ No
- [ ] Can view public doorcard: ☐ Yes ☐ No
- [ ] Can manage terms (admin): ☐ Yes ☐ No
- [ ] Can export data (admin): ☐ Yes ☐ No

### Bug Tracking Template
```
Bug #: ___
Severity: ☐ Critical ☐ High ☐ Medium ☐ Low
Steps to Reproduce:
1.
2.
3.

Expected Result:

Actual Result:

Screenshot/Video:

Browser/Device:
```

---

## 🎯 UAT Success Criteria

### Must Pass (Blockers)
- ✅ Users can log in with OneLogin
- ✅ Users can create and publish doorcards
- ✅ Doorcards display correctly in public view
- ✅ Admin can create and activate terms
- ✅ No critical errors or crashes

### Should Pass (Important)
- ✅ Mobile experience is usable
- ✅ Form validation works correctly
- ✅ Error messages are helpful
- ✅ Beta banner displays appropriately

### Nice to Have (Enhancements)
- ⭐ Fast page load times (<2s)
- ⭐ Intuitive navigation
- ⭐ Helpful empty states
- ⭐ Smooth animations

---

## 📞 Support During UAT

### If Something Breaks

**Priority 1: Check Logs**
```bash
# Browser console (F12)
# Look for red errors

# Server logs
# Check terminal running npm run dev
```

**Priority 2: Check Documentation**
- Full UAT Report: `/docs/UAT_READINESS_REPORT.md`
- Environment Setup: `/docs/ENVIRONMENT_SETUP.md`
- Accessibility: `/docs/ACCESSIBILITY_REPORT.md`

**Priority 3: Quick Fixes**
```bash
# Restart dev server
lsof -ti:3000 | xargs kill && npm run dev

# Clear browser cache
# Cmd+Shift+Delete (Chrome)

# Resync database
npx prisma db push

# Check git status
git status
# If needed, stash changes: git stash
```

### Emergency Rollback

If upgrade causes issues:
```bash
# Switch back to main branch
git checkout main

# Restart dev server
npm run dev

# Report issue for investigation
```

---

## ✅ Pre-UAT Final Checklist

Before starting UAT tomorrow, verify:

- [ ] Dev server running at http://localhost:3000
- [ ] Can access admin dashboard: http://localhost:3000/admin
- [ ] At least one active term exists (Fall 2025)
- [ ] Beta banner shows on all pages
- [ ] Can log in with OneLogin credentials
- [ ] Database has sample data (51 users, 52 doorcards)
- [ ] All 4 console.log cleanups applied
- [ ] Latest code committed to `upgrade/nextjs-16` branch
- [ ] UAT report reviewed: `/docs/UAT_READINESS_REPORT.md`
- [ ] Feedback collection method ready (Google Form, spreadsheet, etc.)

---

## 🎉 Expected UAT Outcome

**Goal**: Validate that the application meets user needs and is ready for production deployment.

**Timeline**:
- UAT Duration: 1-2 days
- Bug fixes: 1-2 days
- Final review: 1 day
- Production deployment: TBD

**Next Steps After UAT**:
1. Collect all feedback and bug reports
2. Prioritize issues (critical vs. nice-to-have)
3. Fix critical bugs
4. Merge `upgrade/nextjs-16` to `main`
5. Deploy to production (Vercel)
6. Monitor production for 48 hours
7. Celebrate successful launch! 🎊

---

**Generated**: 2025-11-11
**UAT Start**: 2025-11-12
**Application**: Next Doorcard v0.1.0 (Next.js 16.0.1)
