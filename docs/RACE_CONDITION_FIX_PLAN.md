# Race Condition Fix Implementation Plan

## Overview

We've identified 8 major race condition vulnerabilities affecting data integrity
and user experience.

## Priority Order

### 🔴 CRITICAL - Fix Immediately

#### 1. **Appointment Replacement Data Loss**

**Location**: `/app/api/doorcards/[id]/route.ts`, `/app/doorcard/actions.ts`
**Problem**: Delete all → Create new pattern risks total data loss **Solution**:
Wrap in transaction

```typescript
// BEFORE (Dangerous)
await prisma.appointment.deleteMany({ where: { doorcardId } });
await prisma.appointment.createMany({ data });

// AFTER (Safe)
await prisma.$transaction(async (tx) => {
  await tx.appointment.deleteMany({ where: { doorcardId } });
  await tx.appointment.createMany({ data });
});
```

### 🟠 HIGH - Fix Next

#### 2. **Doorcard Creation Duplicates**

**Location**: `/app/api/doorcards/route.ts` **Problem**: Check exists → Create
pattern allows duplicates **Solution**: Use transaction with SELECT FOR UPDATE
or handle constraint violation

```typescript
// Solution A: Transaction with lock
await prisma.$transaction(async (tx) => {
  // This locks the row in PostgreSQL
  const existing = await tx.$queryRaw`
    SELECT * FROM "Doorcard" 
    WHERE "userId" = ${userId} 
    AND college = ${college} 
    AND term = ${term} 
    AND year = ${year}
    FOR UPDATE
  `;

  if (existing.length > 0) throw new Error("Already exists");

  return await tx.doorcard.create({ data });
});

// Solution B: Catch constraint violation
try {
  const doorcard = await prisma.doorcard.create({ data });
  return doorcard;
} catch (error) {
  if (error.code === "P2002") {
    // Unique constraint violation
    return { error: "Doorcard already exists" };
  }
  throw error;
}
```

#### 3. **User Registration Username Collision**

**Location**: `/app/api/register/route.ts` **Problem**: Loop to find unique
username can collide **Solution**: Use database to generate unique username

```typescript
// Use a transaction with retry logic
let username = baseUsername;
let attempts = 0;

while (attempts < 10) {
  try {
    const user = await prisma.user.create({
      data: { ...data, username },
    });
    return user;
  } catch (error) {
    if (error.code === "P2002" && attempts < 9) {
      username = `${baseUsername}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      attempts++;
    } else {
      throw error;
    }
  }
}
```

### 🟡 MEDIUM - Fix Soon

#### 4. **OneLogin Account Linking**

**Solution**: Use upsert pattern

```typescript
await prisma.account.upsert({
  where: {
    provider_providerAccountId: {
      provider: "onelogin",
      providerAccountId: account.providerAccountId,
    },
  },
  create: { ...accountData },
  update: {}, // No update needed
});
```

#### 5. **Analytics View Counting**

**Solution**: Use atomic increment with conditional

```typescript
// Store view check in same transaction
await prisma.$transaction(async (tx) => {
  const recentView = await tx.doorcardAnalytics.findFirst({
    where: {
      doorcardId,
      ipAddress,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (!recentView) {
    await tx.doorcardAnalytics.create({ ... });
    await tx.doorcardMetrics.update({
      where: { doorcardId },
      data: {
        totalViews: { increment: 1 },
        uniqueViews: { increment: 1 }
      },
    });
  } else {
    // Just increment total views
    await tx.doorcardMetrics.update({
      where: { doorcardId },
      data: { totalViews: { increment: 1 } },
    });
  }
});
```

#### 6. **Term Management Active Flag**

**Solution**: Use transaction for atomic switch

```typescript
await prisma.$transaction(async (tx) => {
  if (termData.isActive) {
    await tx.term.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }
  return await tx.term.create({ data: termData });
});
```

## Implementation Strategy

### Phase 1: Critical Fixes (Do First)

1. Fix appointment replacement with transactions
2. Add error handling for constraint violations
3. Test thoroughly with concurrent requests

### Phase 2: High Priority Fixes

1. Implement doorcard creation fixes
2. Fix user registration race condition
3. Add integration tests for race conditions

### Phase 3: Medium Priority Fixes

1. Fix OneLogin account linking
2. Improve analytics accuracy
3. Fix term management atomicity

## Testing Plan

### 1. Unit Tests

- Test transaction rollback on failure
- Test constraint violation handling

### 2. Integration Tests

- Simulate concurrent requests
- Verify no duplicates created
- Ensure no data loss

### 3. Load Tests

- Use Apache Bench or similar
- Test with 10-100 concurrent requests
- Monitor for failures

## Database Considerations

### SQLite (Development)

- Limited transaction support
- No SELECT FOR UPDATE
- Use application-level solutions

### PostgreSQL (Production)

- Full transaction support
- Row-level locking available
- Better concurrent performance

## Monitoring

After deployment:

1. Monitor error logs for constraint violations
2. Check for duplicate records
3. Watch transaction rollback rates
4. Monitor performance impact

## Rollback Plan

If issues arise:

1. Revert code changes
2. Keep unique constraints (they protect data)
3. Add additional application-level retries
