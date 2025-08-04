# WCAG Accessibility Testing Guide

## Educational District Compliance Requirements

### Overview

This guide ensures the Next Doorcard application meets WCAG 2.1 Level AA
standards required for educational institutions under Section 508 and ADA
compliance.

## Automated Testing Setup

### 1. Run Accessibility Tests

```bash
# Start development server
npm run dev

# Run comprehensive accessibility tests
npm run cypress:run -- --spec="cypress/e2e/accessibility.cy.ts"

# Or run interactively to see violations
npm run cypress:open
```

### 2. Fix Authentication Issues (if tests fail)

If accessibility tests fail on authentication:

```bash
# Verify test user exists in database
npx prisma studio
# Check for user: besnyib@smccd.edu

# Reset test database if needed
npm run test:db:setup
```

## Manual Testing Checklist

### Screen Reader Testing

- [ ] **VoiceOver (macOS)**: `Cmd + F5` to enable
  - [ ] Navigate through all major pages using VO keys
  - [ ] Verify form fields are properly announced
  - [ ] Check table headers are read correctly
  - [ ] Ensure button purposes are clear
- [ ] **NVDA (Windows)**: Free screen reader
  - [ ] Test same functionality as VoiceOver
  - [ ] Verify landmarks are announced
- [ ] **Test Pages**:
  - [ ] Dashboard (`/dashboard`)
  - [ ] New Doorcard Form (`/doorcard/new`)
  - [ ] Public Doorcard View (`/view/[username]/[term]`)
  - [ ] Admin Panel (`/admin`) - if applicable

### Keyboard Navigation Testing

- [ ] **Tab Order**: Navigate entire application using only Tab/Shift+Tab
  - [ ] Logical tab sequence on all pages
  - [ ] No keyboard traps
  - [ ] All interactive elements reachable
- [ ] **Enter/Space**: Activate buttons and links
- [ ] **Arrow Keys**: Navigate within components (dropdowns, etc.)
- [ ] **Escape Key**: Close modals and dropdowns
- [ ] **Focus Indicators**: Visible focus outline on all elements

### Color Contrast Testing

Use online tools or browser extensions:

- [ ] **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- [ ] **Colour Contrast Analyser**: Desktop app
- [ ] **Chrome DevTools**: Audit tab > Accessibility
- [ ] **Requirements**:
  - [ ] Normal text: 4.5:1 contrast ratio minimum
  - [ ] Large text (18pt+): 3:1 contrast ratio minimum
  - [ ] UI components: 3:1 contrast ratio minimum

### Mobile Accessibility Testing

- [ ] **Touch Targets**: Minimum 44px × 44px (iOS guidelines)
- [ ] **Screen Reader**: Test with mobile screen readers
  - [ ] iOS VoiceOver
  - [ ] Android TalkBack
- [ ] **Zoom**: Test at 200% zoom without horizontal scrolling
- [ ] **Orientation**: Works in both portrait and landscape

## Common Issues and Fixes

### 1. Missing Form Labels

**Issue**: Form fields not announced by screen readers **Fix**: Ensure every
input has proper labeling

```tsx
// Good
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// Or with aria-label
<input type="email" aria-label="Email Address" />
```

### 2. Poor Color Contrast

**Issue**: Text difficult to read for low vision users **Fix**: Adjust colors to
meet contrast ratios

```css
/* Check contrast with online tools */
.text-low-contrast {
  color: #666;
} /* May fail */
.text-good-contrast {
  color: #333;
} /* Should pass */
```

### 3. Missing Heading Structure

**Issue**: Page structure unclear to screen readers **Fix**: Use proper heading
hierarchy

```tsx
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection</h3>
  <h2>Another Section</h2>
```

### 4. Missing ARIA Landmarks

**Issue**: Page regions not identifiable **Fix**: Add semantic HTML or ARIA
roles

```tsx
<nav role="navigation" aria-label="Main navigation">
<main role="main">
<aside role="complementary" aria-label="Sidebar">
```

### 5. Inaccessible Data Tables

**Issue**: Table relationships unclear **Fix**: Add proper headers and scope

```tsx
<table>
  <thead>
    <tr>
      <th scope="col">Day</th>
      <th scope="col">Time</th>
      <th scope="col">Activity</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Monday</th>
      <td>9:00 AM</td>
      <td>Office Hours</td>
    </tr>
  </tbody>
</table>
```

## Testing Workflow

### Before Each Release

1. **Run automated tests**:
   `npm run cypress:run -- --spec="cypress/e2e/accessibility.cy.ts"`
2. **Manual keyboard test**: Navigate key user flows with keyboard only
3. **Screen reader spot check**: Test new features with VoiceOver/NVDA
4. **Color contrast check**: Verify any new UI elements meet contrast
   requirements

### Before Production Deployment

1. **Full manual audit**: Complete all sections above
2. **Third-party audit**: Consider professional accessibility audit
3. **User testing**: Test with actual users who use assistive technology
4. **Documentation**: Update accessibility statement and user guides

## Educational District Requirements

### Section 508 Compliance

- [x] **WCAG 2.1 Level AA** standards implemented
- [ ] **Alternative formats** available (transcripts, descriptions)
- [ ] **Accessibility statement** published
- [ ] **Complaint process** documented

### ADA Title II Compliance

- [ ] **Effective communication** ensured
- [ ] **Equal access** to all functionality
- [ ] **Reasonable accommodations** process defined
- [ ] **Regular testing** schedule established

## Resources

### Testing Tools

- **axe DevTools**: Browser extension for automated testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **Pa11y**: Command-line accessibility testing

### Documentation

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Section 508**: https://www.section508.gov/
- **WebAIM**: https://webaim.org/ (excellent tutorials)

### Screen Readers

- **VoiceOver**: Built into macOS
- **NVDA**: Free Windows screen reader
- **JAWS**: Professional Windows screen reader
- **Chrome Vox**: Chrome extension

## Emergency Accessibility Fixes

If critical accessibility issues are discovered in production:

1. **Immediate**: Add skip links and basic ARIA labels
2. **Short-term**: Fix color contrast and keyboard navigation
3. **Long-term**: Comprehensive audit and remediation plan

## Accessibility Statement Template

```
[Institution Name] is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

Conformance Status: Partially conformant with WCAG 2.1 Level AA
Last Updated: [Date]
Contact: [Accessibility Officer Email]
```

---

**Remember**: Accessibility is not a one-time check but an ongoing
responsibility. Regular testing and user feedback ensure continued compliance
and usability for all users.
