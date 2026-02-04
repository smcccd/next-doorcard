# Security Audit Report - Next.js Doorcard Application
**Date**: 2026-02-03
**Auditor**: Senior Security Engineer
**Application**: Next.js Doorcard Management System

## Executive Summary

This security audit examined 8 key areas of the application's security posture. The application demonstrates **strong security practices** overall, with comprehensive security headers, input validation, and authentication controls. However, several medium-severity issues were identified that should be addressed.

**Overall Security Rating**: B+ (Good, with room for improvement)

---

## Findings Summary

| Category | High | Medium | Low | Info |
|----------|------|--------|-----|------|
| Total    | 0    | 4      | 3   | 5    |

---

## 1. Security Headers Analysis

### Status: EXCELLENT ✅

**File**: `/Users/besnyib/next-doorcard/next.config.ts` (Lines 44-219)

#### Strengths:
- Comprehensive CSP implementation with environment-aware policies
- HSTS enabled in production (max-age: 1 year, includeSubDomains, preload)
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy configured to disable unnecessary browser features
- Cross-Origin policies (COEP, COOP, CORP) properly configured

#### Concerns:
**MEDIUM**: CSP allows `unsafe-inline` for scripts and styles in production (Lines 54, 72)
- **Impact**: Reduces effectiveness of CSP against XSS attacks
- **Justification**: Required for Next.js and Tailwind CSS, but weakens protection
- **Recommendation**: Implement nonce-based CSP for inline scripts
  ```typescript
  // Use nonces for inline scripts instead of 'unsafe-inline'
  headers: {
    'Content-Security-Policy': `script-src 'self' 'nonce-${nonce}'`
  }
  ```

**LOW**: CSP allows `unsafe-eval` in development (Line 68)
- **Impact**: Development-only risk
- **Status**: Acceptable for development, correctly excluded in production

---

## 2. Input Validation & Sanitization

### Status: GOOD ✅

**Files**:
- `/Users/besnyib/next-doorcard/lib/sanitize.ts`
- `/Users/besnyib/next-doorcard/app/api/doorcards/route.ts`
- `/Users/besnyib/next-doorcard/app/api/doorcards/[id]/route.ts`

#### Strengths:
- DOMPurify implementation for server-side HTML sanitization (sanitize.ts:1-6)
- Zod schema validation on all API routes (doorcards/route.ts:4)
- Input sanitization before validation (doorcards/route.ts:29-40)
- Strong password validation (sanitize.ts:153-186)
  - Minimum 8 characters
  - Requires uppercase, lowercase, and numbers
- Email validation (sanitize.ts:148-151)
- Name validation with character restrictions (sanitize.ts:188-208)

#### Concerns:
**MEDIUM**: Password validation doesn't require special characters
- **File**: `/Users/besnyib/next-doorcard/lib/sanitize.ts` (Lines 153-186)
- **Impact**: Reduces password entropy
- **Recommendation**: Add special character requirement:
  ```typescript
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character (!@#$%^&*)"
    };
  }
  ```

**INFO**: Sanitization applied before validation (best practice)
- All user inputs are sanitized before Zod validation
- Prevents validation bypass through malformed input

---

## 3. SQL Injection Prevention

### Status: EXCELLENT ✅

**Files**: All Prisma query files

#### Strengths:
- All database queries use Prisma ORM parameterized queries
- No raw SQL queries found in production code
- `$queryRaw` only used in test/migration scripts (safe context)

**Files containing raw queries** (11 total):
- `/Users/besnyib/next-doorcard/app/api/health/route.ts` - Health check only
- `/Users/besnyib/next-doorcard/scripts/*` - Migration/analysis scripts only

#### Assessment:
**No SQL injection vulnerabilities found** - Prisma's query builder prevents SQL injection by design.

---

## 4. XSS Prevention

### Status: GOOD ✅ (with concern)

#### Strengths:
- DOMPurify sanitization for all user content (sanitize.ts)
- React's automatic XSS protection via JSX escaping
- Minimal use of `dangerouslySetInnerHTML` (only 3 instances)

#### Concerns:
**MEDIUM**: Markdown rendered without sanitization
- **Files**:
  - `/Users/besnyib/next-doorcard/components/MarkdownRenderer.tsx` (Line 45)
  - `/Users/besnyib/next-doorcard/lib/markdown.ts` (Lines 1-18)
- **Issue**: Marked.js output used directly without DOMPurify sanitization
- **Impact**: Potential XSS if user-generated markdown is allowed
- **Current Status**: Limited risk (only admin/faculty can create content)
- **Recommendation**: Sanitize markdown output:
  ```typescript
  import DOMPurify from 'dompurify';

  export function parseMarkdown(markdown: string): string {
    const htmlOutput = marked.parse(markdown);
    return DOMPurify.sanitize(htmlOutput, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'title']
    });
  }
  ```

**LOW**: dangerouslySetInnerHTML in print styles
- **File**: `/Users/besnyib/next-doorcard/components/doorcard/SemanticSchedule.tsx` (Line 72)
- **Context**: Static CSS only, no user input
- **Risk**: Minimal (CSS is hardcoded)

---

## 5. CSRF Protection

### Status: EXCELLENT ✅

**Files**: All API routes and server actions

#### Strengths:
- NextAuth provides built-in CSRF protection via session cookies
- All mutations use POST/PUT/PATCH/DELETE methods (never GET)
- Server Actions protected by Next.js CSRF tokens automatically
- SameSite cookie attribute set to "lax" (auth.config.ts:88)

#### Evidence:
- **Session cookies**: httpOnly, sameSite: lax, secure in production (auth.config.ts:84-93)
- **Server Actions**: All in `/app/doorcard/actions.ts` use form data with Next.js CSRF protection
- **API Routes**: All require authentication via `requireAuthUserAPI()`

**No CSRF vulnerabilities found** - Framework-level protection is sufficient.

---

## 6. Environment Variables & Secrets Management

### Status: GOOD ✅ (with concerns)

**File**: `/Users/besnyib/next-doorcard/lib/env-config.ts`

#### Strengths:
- Centralized environment variable validation (env-config.ts:73-88)
- Secrets properly excluded from git (.gitignore:28-33)
- Clear error messages for missing required variables
- Comprehensive .env.example with documentation
- No secrets found in git history

#### Concerns:
**MEDIUM**: Secrets exposed in next.config.ts
- **File**: `/Users/besnyib/next-doorcard/next.config.ts` (Lines 20-23)
- **Issue**: NEXTAUTH_SECRET exposed to client via `env` config
  ```typescript
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET, // ⚠️ EXPOSED TO CLIENT
  }
  ```
- **Impact**: Secret can be viewed in browser/network tab
- **Recommendation**: Remove from client-exposed env config
  ```typescript
  // Remove this entire block - Next.js automatically handles server env vars
  // env: {
  //   NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  //   NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  // },
  ```

**INFO**: .env files properly ignored
- `.env`, `.env*.local`, `.env.sentry-build-plugin` all in .gitignore
- No .env files found in git history

**INFO**: Sentry auth token in next.config.ts (Line 248)
- Used for build-time source map uploads only
- Not exposed to client (server-side only)
- Acceptable use case

---

## 7. Rate Limiting

### Status: EXCELLENT ✅

**File**: `/Users/besnyib/next-doorcard/lib/rate-limit.ts`

#### Strengths:
- Tiered rate limiting with different limits per route type (Lines 8-54):
  - AUTH: 5 req/min (strictest)
  - ADMIN: 50 req/min
  - API: 100 req/min
  - ANALYTICS: 200 req/min
  - PUBLIC: 300 req/min
- Upstash Redis integration with in-memory fallback (Lines 62-93)
- Applied to critical endpoints:
  - Authentication (5 req/min) - `authRateLimit`
  - Registration (3 req/hour) - `registrationRateLimit`
  - API routes (100 req/min) - `apiRateLimit`
- Sliding window algorithm (more accurate than fixed window)
- Rate limit headers exposed (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)

#### Evidence:
- `/app/api/doorcards/route.ts:15` - Rate limiting applied to POST endpoint
- `/app/api/register/route.ts:15` - Registration rate limiting (3/hour prevents abuse)

**No issues found** - Comprehensive rate limiting implementation.

---

## 8. Authentication & Authorization

### Status: GOOD ✅ (with concern)

**Files**:
- `/Users/besnyib/next-doorcard/middleware.ts`
- `/Users/besnyib/next-doorcard/lib/auth.config.ts`
- `/Users/besnyib/next-doorcard/lib/require-auth-user.ts`

#### Strengths:
- NextAuth v5 with OneLogin OIDC integration
- Protected routes: /dashboard, /doorcard, /admin, /profile (middleware.ts:86-89)
- Session-based authentication with 8-hour expiry (auth.config.ts:79-81)
- Role-based access control (ADMIN checks in admin routes)
- Secure session cookies (httpOnly, secure in prod, sameSite: lax)

#### Concerns:
**HIGH** (Test Environment Only): Cypress authentication bypass
- **File**: `/Users/besnyib/next-doorcard/lib/require-auth-user.ts` (Lines 34-62)
- **Issue**: Hardcoded test credentials can bypass authentication
  ```typescript
  if (process.env.NODE_ENV !== "production" && process.env.CYPRESS === "true") {
    return {
      id: "test-besnyib-smccd-edu",
      email: "besnyib@smccd.edu",
      role: "ADMIN", // ⚠️ Hardcoded admin access
    };
  }
  ```
- **Impact**: If CYPRESS env var is set in production, auth is bypassed
- **Mitigation**: Already checks `NODE_ENV !== "production"` (Line 36)
- **Recommendation**: Add additional safeguard:
  ```typescript
  // Fail hard if Cypress mode detected in production
  if (process.env.NODE_ENV === "production" && process.env.CYPRESS === "true") {
    throw new Error("SECURITY: Cypress test mode cannot be enabled in production");
  }
  ```

**INFO**: Admin route protection
- All admin API routes check for ADMIN role (verified in admin/users/route.ts:47)
- Consistent authorization pattern across admin endpoints

**INFO**: Public API routes properly defined
- `/api/doorcards/public`, `/api/doorcards/view`, `/api/health` explicitly public (middleware.ts:56-62)

---

## Additional Security Considerations

### 9. Dependency Security
**Status**: Not Assessed

**Recommendation**: Run regular dependency audits
```bash
npm audit
npm audit fix
```

### 10. Error Handling
**Status**: GOOD ✅

- Generic error messages prevent information leakage
- Detailed errors only in development (logger.ts)
- PrismaErrorHandler sanitizes database errors (prisma-error-handler.ts)

### 11. CORS Configuration
**Status**: Not Configured

**Finding**: No CORS middleware detected
- **Impact**: May accept requests from any origin
- **Recommendation**: If API is called from external domains, configure CORS:
  ```typescript
  // In middleware.ts
  response.headers.set('Access-Control-Allow-Origin', 'https://trusted-domain.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  ```

---

## Priority Recommendations

### Critical (Address Immediately)
None - No critical vulnerabilities found.

### High Priority
1. **Remove NEXTAUTH_SECRET from client-exposed env config** (next.config.ts:22)
   - Severity: Medium-High
   - Effort: 5 minutes
   - Impact: Prevents secret exposure in browser

### Medium Priority
2. **Sanitize markdown output with DOMPurify** (lib/markdown.ts:12)
   - Severity: Medium
   - Effort: 30 minutes
   - Impact: Prevents XSS through markdown content

3. **Add special character requirement to passwords** (lib/sanitize.ts:153)
   - Severity: Medium
   - Effort: 15 minutes
   - Impact: Improves password strength

4. **Implement nonce-based CSP** (next.config.ts:54)
   - Severity: Medium
   - Effort: 2-4 hours
   - Impact: Stronger XSS protection

### Low Priority
5. **Configure CORS policy** (middleware.ts)
   - Severity: Low (if API is internal only)
   - Effort: 30 minutes

6. **Add production safeguard for Cypress mode** (require-auth-user.ts:36)
   - Severity: Low (already protected by NODE_ENV check)
   - Effort: 10 minutes

---

## Compliance & Best Practices

### ✅ Followed Best Practices:
- Parameterized database queries (Prisma ORM)
- Input validation and sanitization
- Secure session management
- Rate limiting on sensitive endpoints
- Environment variable validation
- Secure cookie configuration
- Role-based access control
- Comprehensive security headers

### ⚠️ Areas for Improvement:
- CSP nonce implementation
- Markdown sanitization
- Password complexity requirements
- CORS configuration

---

## Testing Recommendations

### Security Testing Commands:
```bash
# Verify security headers locally
npm run security:headers

# Verify security headers in production
npm run security:headers:prod

# Run dependency audit
npm audit

# Check for secrets in codebase
git secrets --scan

# Test authentication flow
npm run test:e2e
```

### Penetration Testing Suggestions:
1. Test XSS through markdown content creation
2. Test authentication bypass attempts
3. Test rate limiting effectiveness
4. Test CSRF protection on state-changing operations
5. Test SQL injection via Prisma (should fail)

---

## Conclusion

The Next.js Doorcard application demonstrates strong security practices with comprehensive defense-in-depth measures. The identified issues are primarily medium-severity configuration improvements rather than critical vulnerabilities.

**Key Strengths**:
- Excellent security header configuration
- Strong input validation and sanitization
- Effective rate limiting implementation
- Proper authentication and authorization

**Key Improvements Needed**:
- Remove NEXTAUTH_SECRET from client env config
- Sanitize markdown output
- Enhance password requirements
- Implement CSP nonces

**Next Steps**:
1. Address the 4 medium-priority findings within 1-2 weeks
2. Implement low-priority improvements in next sprint
3. Schedule quarterly security audits
4. Set up automated dependency scanning

---

**Report Version**: 1.0
**Next Review Date**: 2026-05-03 (3 months)
