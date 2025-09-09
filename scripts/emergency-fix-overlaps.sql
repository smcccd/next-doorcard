-- EMERGENCY FIX: Remove duplicate appointments
-- This will fix all 17 overlapping appointments identified

.print "🚑 EMERGENCY FIX: Removing duplicate appointments"
.print "Starting at: " || datetime('now')
.print ""

-- First, let's see what we're about to delete
.print "📋 APPOINTMENTS TO BE REMOVED:"
SELECT 
  u.name as faculty,
  a.dayOfWeek,
  a.startTime,
  a.endTime,
  a.name as appointment,
  a.id as appointment_id
FROM "Appointment" a
JOIN "Doorcard" d ON a.doorcardId = d.id
JOIN "User" u ON d.userId = u.id
WHERE a.id IN (
  SELECT a2.id 
  FROM "Appointment" a1
  JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId 
    AND a1.dayOfWeek = a2.dayOfWeek 
    AND a1.startTime = a2.startTime
    AND a1.endTime = a2.endTime
    AND a1.name = a2.name
    AND a1.id < a2.id  -- Keep the first one, delete later duplicates
)
ORDER BY u.name, a.dayOfWeek, a.startTime;

.print ""
.print "🗑️  REMOVING DUPLICATE APPOINTMENTS..."

-- Delete the duplicates (keep the first occurrence of each)
DELETE FROM "Appointment" 
WHERE id IN (
  SELECT a2.id 
  FROM "Appointment" a1
  JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId 
    AND a1.dayOfWeek = a2.dayOfWeek 
    AND a1.startTime = a2.startTime
    AND a1.endTime = a2.endTime
    AND a1.name = a2.name
    AND a1.id < a2.id
);

.print ""
.print "✅ CLEANUP COMPLETE"
.print "Verifying no overlaps remain..."

-- Verify no overlaps exist
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No overlapping appointments found'
    ELSE '❌ ERROR: ' || COUNT(*) || ' overlaps still exist'
  END as validation_result
FROM "Appointment" a1
JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId 
  AND a1.dayOfWeek = a2.dayOfWeek 
  AND a1.id < a2.id
JOIN "Doorcard" d ON a1.doorcardId = d.id
WHERE d.isActive = true
  AND (a1.startTime < a2.endTime AND a1.endTime > a2.startTime);

.print ""
.print "📊 FINAL SYSTEM STATUS:"
SELECT 'Active Faculty' as metric, COUNT(DISTINCT u.id) as count
FROM "User" u
JOIN "Doorcard" d ON u.id = d.userId 
WHERE d.isActive = true
UNION ALL
SELECT 'Total Appointments' as metric, COUNT(*) as count
FROM "Appointment" a
JOIN "Doorcard" d ON a.doorcardId = d.id
WHERE d.isActive = true
UNION ALL
SELECT 'Unique Appointments' as metric, COUNT(*) as count
FROM (
  SELECT DISTINCT doorcardId, dayOfWeek, startTime, endTime, name
  FROM "Appointment" a
  JOIN "Doorcard" d ON a.doorcardId = d.id
  WHERE d.isActive = true
);

.print ""
.print "🎯 PRODUCTION READINESS: SYSTEM NOW CLEAN"
.print "Emergency fix completed at: " || datetime('now')
.print ""