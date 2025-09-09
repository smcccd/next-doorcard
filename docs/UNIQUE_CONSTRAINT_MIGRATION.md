# Doorcard Unique Constraint Migration Plan

## Current State (✅ Good News!)

- **No existing duplicates** in the database
- 218 total doorcards (186 active, 32 inactive)
- No users have multiple doorcards for the same college/term/year
- Migration can proceed without data cleanup

## Migration Strategy

### 1. Change Required

**Current constraint:**

```prisma
@@unique([userId, college, term, year, isActive])
```

**New constraint:**

```prisma
@@unique([userId, college, term, year])
```

### 2. Impact Analysis

- ✅ **No data cleanup needed** - no existing duplicates
- ⚠️ **API changes needed** - remove ability to create duplicates by toggling
  `isActive`
- ⚠️ **Import scripts** - must handle duplicates properly

### 3. Implementation Steps

#### Step 1: Create Prisma Migration

```bash
npx prisma migrate dev --name remove_isactive_from_unique_constraint
```

#### Step 2: Update API Logic

- Modify doorcard creation to check for existing cards regardless of `isActive`
- Update toggle active/inactive logic
- Ensure import scripts handle constraint properly

#### Step 3: Add Safety Checks

- Pre-migration validation script
- Post-migration verification
- Rollback plan if needed

### 4. Benefits

- Prevents accidental duplicates
- Simplifies data model
- Ensures data integrity
- Makes import process more predictable

### 5. Risks & Mitigation

- **Risk**: Import scripts may fail on duplicates
  - **Mitigation**: Update import logic to use upsert pattern
- **Risk**: Users expect multiple inactive doorcards
  - **Mitigation**: Clear error messages and UI updates

### 6. Testing Plan

1. Test migration on development database
2. Test all CRUD operations
3. Test import scripts with duplicate data
4. Verify error handling

## Migration Script

The migration will:

1. Drop the old unique constraint
2. Add the new unique constraint
3. Update any related indexes

## Rollback Plan

If issues arise:

1. Restore from backup
2. Or create reverse migration adding `isActive` back to constraint
