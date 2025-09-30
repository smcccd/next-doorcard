# End-User Testing Strategy for Next Doorcard

## Testing Overview

This document outlines the testing strategy for faculty end-users to validate
the Next Doorcard application before full launch. The testing focuses on
real-world usage scenarios and critical user journeys.

## Test Environment

- **URL**: https://next-doorcard.vercel.app
- **Authentication**: OneLogin SSO (SMCCD credentials)
- **Supported Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Testing**: iOS Safari, Android Chrome

## Test Participants

### Phase 1: Core Team (5-10 users)

- 2-3 faculty members from each college (Skyline, CSM, Cañada)
- Mix of full-time and part-time faculty
- Include both tech-savvy and less technical users

### Phase 2: Pilot Group (20-30 users)

- Department chairs and coordinators
- Faculty with varying schedule complexities
- New and veteran faculty members

## Critical User Journeys to Test

### 1. First-Time User Experience (30 minutes)

**Objective**: Validate smooth onboarding for new users

#### Test Steps:

1. **Initial Login**
   - Navigate to https://next-doorcard.vercel.app
   - Click "Sign in with SMCCD OneLogin"
   - Authenticate with OneLogin credentials
   - ✅ **Verify**: Successful redirect to dashboard

2. **Profile Setup**
   - Review imported data (name, email from OneLogin)
   - Select academic title (if applicable)
   - Add pronouns (optional)
   - Choose display name format
   - Select college/campus
   - ✅ **Verify**: Profile saves successfully
   - ✅ **Verify**: Display name appears correctly in header

3. **Create First Doorcard**
   - Click "New Doorcard" button
   - Enter doorcard name (e.g., "Spring 2025 Schedule")
   - Add office number
   - Select term and year
   - ✅ **Verify**: Doorcard creates successfully
   - ✅ **Verify**: Appears in dashboard

### 2. Schedule Management (20 minutes)

**Objective**: Test appointment creation and editing

#### Test Steps:

1. **Add Office Hours**
   - Navigate to doorcard editor
   - Click "Add Appointment"
   - Select "Office Hours" category
   - Set day(s) and time(s)
   - Add location (optional)
   - ✅ **Verify**: Appointments display correctly
   - ✅ **Verify**: No time conflicts allowed

2. **Add Classes**
   - Add multiple class appointments
   - Use different categories (Lecture, Lab, etc.)
   - Test recurring patterns (MW, TTh)
   - ✅ **Verify**: Schedule displays in correct order
   - ✅ **Verify**: All days of week available

3. **Edit/Delete Appointments**
   - Modify existing appointment times
   - Delete an appointment
   - ✅ **Verify**: Changes save immediately
   - ✅ **Verify**: UI updates without refresh

### 3. Publishing Workflow (15 minutes)

**Objective**: Test doorcard publishing and visibility

#### Test Steps:

1. **Preview Before Publishing**
   - Use "Preview" button
   - ✅ **Verify**: Preview matches edit view
   - ✅ **Verify**: All information displays correctly

2. **Publish Doorcard**
   - Toggle "Active" switch
   - Toggle "Public" switch
   - Copy public URL
   - ✅ **Verify**: Status indicators update
   - ✅ **Verify**: Public URL works in incognito/private window

3. **Test Public View**
   - Open public URL in different browser
   - ✅ **Verify**: No login required for public view
   - ✅ **Verify**: Contact information displays correctly
   - ✅ **Verify**: Print button works

### 4. Multi-Term Management (15 minutes)

**Objective**: Test handling multiple terms

#### Test Steps:

1. **Create Future Term Doorcard**
   - Create doorcard for upcoming term
   - ✅ **Verify**: Shows in "Upcoming Terms" section
   - ✅ **Verify**: Can be edited but shows as inactive

2. **Clone Existing Doorcard**
   - Use "Duplicate" feature
   - Change term/year
   - Modify schedule as needed
   - ✅ **Verify**: All appointments copy correctly
   - ✅ **Verify**: New doorcard is independent

3. **Archive Old Doorcard**
   - Deactivate previous term's doorcard
   - ✅ **Verify**: Moves to "Past Terms" section
   - ✅ **Verify**: Still viewable but marked as archived

### 5. Print Testing (10 minutes)

**Objective**: Validate print functionality

#### Test Steps:

1. **Print from Dashboard**
   - Click print icon on doorcard
   - ✅ **Verify**: Print preview opens
   - ✅ **Verify**: Fits on single 8.5x11 page
   - ✅ **Verify**: QR code visible and scannable

2. **Print from Public View**
   - Navigate to public URL
   - Click "Print Doorcard"
   - ✅ **Verify**: Clean print layout
   - ✅ **Verify**: No navigation elements in print

### 6. Mobile Experience (20 minutes)

**Objective**: Test mobile responsiveness

#### Test Steps:

1. **Mobile Dashboard**
   - Access dashboard on phone
   - ✅ **Verify**: All buttons accessible
   - ✅ **Verify**: Cards stack properly
   - ✅ **Verify**: Navigation menu works

2. **Mobile Editing**
   - Edit doorcard on mobile
   - Add/modify appointments
   - ✅ **Verify**: Form inputs usable
   - ✅ **Verify**: Time pickers work
   - ✅ **Verify**: Save functions properly

3. **Mobile Public View**
   - Share public URL via text/email
   - Open on mobile device
   - ✅ **Verify**: Schedule readable
   - ✅ **Verify**: Contact info accessible
   - ✅ **Verify**: Print option available

## Edge Cases to Test

### Data Validation

- [ ] Very long office numbers (>10 characters)
- [ ] Special characters in doorcard names
- [ ] Overlapping appointment times
- [ ] Appointments spanning midnight
- [ ] Back-to-back appointments

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Chrome Mobile (Android)

### Performance Testing

- [ ] Dashboard with 10+ doorcards
- [ ] Doorcard with 20+ appointments
- [ ] Slow network conditions (3G)
- [ ] Multiple browser tabs open

## Accessibility Testing

- [ ] Keyboard navigation throughout app
- [ ] Screen reader compatibility (NVDA/JAWS)
- [ ] Color contrast in light/dark modes
- [ ] Focus indicators visible
- [ ] Form labels and error messages clear

## Bug Reporting Template

### Issue Report

**Date**: [Date]  
**Tester Name**: [Name]  
**Browser/Device**: [e.g., Chrome on Windows]

**Issue Description**: [Clear description of the problem]

**Steps to Reproduce**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]

**Actual Result**: [What actually happened]

**Screenshot/Recording**: [Attach if applicable]

**Severity**:

- [ ] Critical (Blocks core functionality)
- [ ] Major (Significant feature broken)
- [ ] Minor (Cosmetic or minor inconvenience)

## Testing Timeline

### Week 1: Core Team Testing

- **Day 1-2**: First-time setup and basic functionality
- **Day 3-4**: Schedule management and publishing
- **Day 5**: Bug fixes and retesting

### Week 2: Pilot Testing

- **Day 1-3**: Expanded user group testing
- **Day 4**: Collect feedback via survey
- **Day 5**: Priority bug fixes

### Week 3: Final Validation

- **Day 1-2**: Retest critical issues
- **Day 3**: Performance and load testing
- **Day 4-5**: Final adjustments and documentation

## Success Criteria

- ✅ 95% of users can complete first-time setup without assistance
- ✅ 100% of users can create and publish a doorcard
- ✅ Zero critical bugs in production
- ✅ Page load times under 3 seconds
- ✅ Mobile experience rated 4+ out of 5
- ✅ Print output matches on-screen display

## Feedback Collection

### Survey Questions (Post-Testing)

1. How easy was it to create your first doorcard? (1-5 scale)
2. Did the import from OneLogin work correctly? (Yes/No + details)
3. Were you able to set up your schedule as needed? (Yes/No + details)
4. How would you rate the mobile experience? (1-5 scale)
5. What features are missing that you need?
6. Would you recommend this to colleagues? (Yes/No + why)
7. Any other feedback or suggestions?

### Feedback Channels

- **Email**: doorcard-feedback@smccd.edu (example)
- **GitHub Issues**: https://github.com/bryan-besnyi/next-doorcard/issues
- **Teams Channel**: #doorcard-testing
- **Weekly Zoom Check-ins**: Fridays 2-3pm

## Post-Launch Monitoring

- Monitor error rates in Sentry
- Track usage analytics in Microsoft Clarity
- Weekly review of user feedback
- Monthly feature request prioritization

## Contact Information

**Project Lead**: [Name]  
**Technical Support**: [Email/Phone]  
**Testing Coordinator**: [Name]  
**Emergency Contact**: [Phone]
