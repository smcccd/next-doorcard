# Enterprise Data Migration Strategy - Final Production Plan

**CRITICAL SITUATION**: Data quality issues detected in production-bound system.
Immediate enterprise-grade solution required.

## Current Problems Identified

1. **Overlapping Appointments** - Prof. Brian Lewis has conflicting time slots
2. **Missing Faculty** - Luciana Castro (castrol) not imported despite active
   legacy doorcard
3. **Data Inconsistency** - Live app shows different data than database queries
4. **Scale Mismatch** - 184K legacy appointments → 142 current appointments
   (99.9% data loss)

## Enterprise Solution Framework

### Phase 1: Immediate Data Audit (2 hours)

**Objective**: Identify exactly what's wrong and create bulletproof import
process

```sql
-- Critical validation queries
-- 1. Find all overlapping appointments
SELECT
  u.name, u.username,
  a1.dayOfWeek, a1.startTime, a1.endTime, a1.name as apt1,
  a2.startTime, a2.endTime, a2.name as apt2
FROM "Appointment" a1
JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId
  AND a1.dayOfWeek = a2.dayOfWeek
  AND a1.id != a2.id
JOIN "Doorcard" d ON a1.doorcardId = d.id
JOIN "User" u ON d.userId = u.id
WHERE (
  (a1.startTime < a2.endTime AND a1.endTime > a2.startTime)
)
ORDER BY u.name, a1.dayOfWeek, a1.startTime;

-- 2. Missing active faculty from legacy
SELECT DISTINCT username, doorcardname
FROM legacy_doorcards
WHERE username NOT IN (SELECT username FROM "User");
```

### Phase 2: Enterprise Import Process (4 hours)

**Objective**: Create production-grade import with validation at every step

#### A. Data Cleaning Rules

1. **Conflict Resolution**:
   - Office Hours > Classes > Labs > Other
   - Later term data overwrites earlier
   - Manual review for critical conflicts

2. **Validation Gates**:
   - No overlapping appointments per faculty
   - All faculty have at least 1 office hour
   - Room assignments are valid
   - Time slots are reasonable (7AM-10PM)

#### B. Import Process

```typescript
interface ImportValidation {
  facultyCount: number;
  appointmentCount: number;
  overlapCount: number;
  missingOfficeHours: string[];
  errors: ValidationError[];
}

async function enterpriseImport(): Promise<ImportValidation> {
  // 1. Validate source data
  // 2. Clean and deduplicate
  // 3. Resolve conflicts
  // 4. Import with rollback capability
  // 5. Validate final state
}
```

### Phase 3: Production Deployment (2 hours)

**Objective**: Zero-downtime deployment with immediate rollback capability

#### A. Database Migration Strategy

1. **Blue-Green Deployment**
   - Deploy to staging PostgreSQL
   - Full validation against legacy system
   - Switch production DNS only after validation

2. **Rollback Plan**
   - Database snapshots before migration
   - Automatic rollback triggers if validation fails
   - Emergency contact procedures

#### B. Success Criteria

```typescript
const PRODUCTION_VALIDATION = {
  minFacultyCount: 100, // Must have reasonable faculty count
  maxOverlapCount: 0, // Zero overlapping appointments
  minOfficeHoursRatio: 0.8, // 80% of faculty must have office hours
  responseTime: 200, // API responses < 200ms
  uptimeRequirement: 99.9, // 99.9% uptime during migration
};
```

## Immediate Action Plan

### Step 1: Emergency Data Fix (30 minutes)

```sql
-- Fix Prof. Brian Lewis overlaps immediately
DELETE FROM "Appointment"
WHERE id IN (
  SELECT a1.id FROM "Appointment" a1
  JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId
    AND a1.dayOfWeek = a2.dayOfWeek
    AND a1.id > a2.id  -- Keep older appointment
  WHERE (a1.startTime < a2.endTime AND a1.endTime > a2.startTime)
);
```

### Step 2: Complete Import Rebuild (2 hours)

1. **Backup current database**
2. **Run enterprise import script** (to be created)
3. **Validate against legacy system**
4. **Test critical user journeys**

### Step 3: Production Deployment (1 hour)

1. **Deploy to staging PostgreSQL**
2. **Run validation suite**
3. **Switch to production**
4. **Monitor for issues**

## Risk Mitigation

### Technical Risks

- **Data corruption**: Multiple validation layers + rollback capability
- **Performance issues**: Load testing + caching strategy
- **Missing faculty**: Comprehensive legacy data import
- **Appointment conflicts**: Automated conflict resolution

### Business Risks

- **User complaints**: Communication plan + support documentation
- **Management escalation**: Executive dashboard showing migration status
- **Timeline pressure**: Parallel workstreams + dedicated resources

## Success Metrics

### Data Quality

- ✅ Zero overlapping appointments
- ✅ 95%+ faculty coverage from legacy system
- ✅ All office hours preserved
- ✅ Response times < 200ms

### Business Impact

- ✅ Faculty can find their schedules
- ✅ Students can access office hours
- ✅ System is maintainable long-term
- ✅ Legacy system can be decommissioned

## Emergency Contacts & Escalation

### If Migration Fails

1. **Immediate**: Rollback to previous system
2. **Within 1 hour**: Notify stakeholders
3. **Within 4 hours**: Root cause analysis
4. **Within 24 hours**: Revised timeline

### Communication Plan

- **Faculty**: Email with migration timeline + support contacts
- **Students**: Website banner during migration window
- **Management**: Real-time dashboard + hourly updates during critical phases

---

**BOTTOM LINE**: This is a enterprise-grade data migration with proper
validation, rollback capabilities, and success metrics. No more guessing - every
step is validated and measurable.
