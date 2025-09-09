# Authentication Patterns for Next-Doorcard

This document explains the authentication patterns used in the Next-Doorcard
application and why they're more secure than relying solely on middleware.

## Why This Approach?

Relying solely on middleware for auth control can be problematic because:

1. **Middleware can be bypassed** in certain scenarios
2. **Inconsistent error handling** across different parts of the app
3. **Limited access to user data** (only session info, not full user object)
4. **Harder to maintain** when auth logic is scattered
5. **Less granular control** over auth behavior

## Auth Functions Overview

### Server-Side Functions (lib/require-auth-user.ts)

#### `requireAuthUser()`

**Use for:** Server components and pages that require authentication
**Behavior:** Redirects to `/login` if user is not authenticated **Returns:**
Full user object from database

```typescript
import { requireAuthUser } from "@/lib/require-auth-user";

export default async function ProtectedPage() {
  const user = await requireAuthUser();
  // user is guaranteed to exist here
  return <div>Hello, {user.name}!</div>;
}
```

#### `requireAuthUserAPI()`

**Use for:** API routes that need to return proper HTTP error responses
**Behavior:** Returns error object if user is not authenticated **Returns:**
`{ user }` or `{ error, status }`

```typescript
import { requireAuthUserAPI } from "@/lib/require-auth-user";

export async function POST(req: Request) {
  const authResult = await requireAuthUserAPI();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  const { user } = authResult;
  // user is guaranteed to exist here
}
```

#### `getAuthUser()`

**Use for:** API routes that need to handle auth failures gracefully
**Behavior:** Returns null if user is not authenticated (no redirect)
**Returns:** User object or null

```typescript
import { getAuthUser } from "@/lib/require-auth-user";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Please log in" }, { status: 401 });
  }
  // user exists here
}
```

#### `getOptionalAuthUser()`

**Use for:** Public pages that show different content for logged-in users
**Behavior:** Returns null if user is not authenticated (no redirect)
**Returns:** User object or null

```typescript
import { getOptionalAuthUser } from "@/lib/require-auth-user";

export default async function PublicPage() {
  const user = await getOptionalAuthUser();

  return (
    <div>
      <h1>Welcome to our site!</h1>
      {user ? (
        <p>Hello, {user.name}! <a href="/dashboard">Go to Dashboard</a></p>
      ) : (
        <p><a href="/login">Log in</a> to access your dashboard</p>
      )}
    </div>
  );
}
```

### Client-Side Functions

#### `useSession` (from next-auth/react)

**Use for:** Client components **Behavior:** Provides session data reactively
**Returns:** Session object with loading states

```typescript
import { useSession } from "next-auth/react";

export default function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Please log in</div>;

  return <div>Hello, {session.user.name}!</div>;
}
```

#### `clientAuthHelpers`

**Use for:** Utility functions in client components **Behavior:** Helper
functions for common auth checks **Returns:** Various auth-related utilities

```typescript
import { clientAuthHelpers } from "@/lib/require-auth-user";

export default function ClientComponent() {
  const { data: session } = useSession();

  const isLoggedIn = clientAuthHelpers.isAuthenticated(session);
  const userEmail = clientAuthHelpers.getUserEmail(session);

  return <div>Status: {isLoggedIn ? 'Logged in' : 'Not logged in'}</div>;
}
```

## Migration Guide

### Before (Old Pattern)

```typescript
// API Route
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Use user...
}
```

### After (New Pattern)

```typescript
// API Route
import { requireAuthUserAPI } from "@/lib/require-auth-user";

export async function POST(req: Request) {
  const authResult = await requireAuthUserAPI();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  const { user } = authResult;

  // Use user...
}
```

### Before (Old Pattern)

```typescript
// Page Component
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  return <div>Hello, {user.name}!</div>;
}
```

### After (New Pattern)

```typescript
// Page Component
import { requireAuthUser } from "@/lib/require-auth-user";

export default async function ProtectedPage() {
  const user = await requireAuthUser();

  return <div>Hello, {user.name}!</div>;
}
```

## Migration Script

We've created a migration script to help update your codebase:

```bash
node scripts/migrate-auth-patterns.js
```

This script will automatically update most auth patterns in your codebase. After
running it:

1. Review the changes made
2. Test your application thoroughly
3. Update any remaining auth patterns manually if needed
4. Consider simplifying your middleware.ts file

## Middleware Considerations

With this new auth pattern, you can simplify your middleware to focus on:

1. **Public asset protection** (static files, etc.)
2. **Basic routing logic** (redirects for authenticated users)
3. **Rate limiting**
4. **Logging and monitoring**

You can remove complex auth logic from middleware since each route now handles
its own authentication.

## Best Practices

1. **Always use the appropriate function** for your use case
2. **Handle errors gracefully** in API routes
3. **Test auth flows thoroughly** after migration
4. **Keep client-side auth simple** with useSession
5. **Document any custom auth logic** you add

## Security Benefits

1. **Defense in depth** - Multiple layers of auth protection
2. **Consistent error handling** - Same auth logic everywhere
3. **Full user context** - Access to complete user data
4. **Harder to bypass** - Auth checks at the route level
5. **Easier to audit** - Centralized auth logic

## Troubleshooting

### Common Issues

1. **Import errors** - Make sure you're importing from the correct path
2. **Type errors** - The functions return properly typed objects
3. **Redirect loops** - Check that your login page doesn't require auth
4. **Session issues** - Verify your NextAuth configuration

### Debug Tips

1. Add console logs to see which auth function is being called
2. Check the browser network tab for API auth failures
3. Verify session cookies are being set correctly
4. Test with both authenticated and unauthenticated users
