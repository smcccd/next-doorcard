-- ENTERPRISE DATA VALIDATION SUITE
-- Run this to identify ALL problems before production

.print "🔍 ENTERPRISE DATA VALIDATION REPORT"
.print "Generated: " || datetime('now')
.print "========================================"
.print ""

-- 1. CRITICAL: Find overlapping appointments
.print "❌ CRITICAL ISSUE: Overlapping Appointments"
.print "These MUST be fixed before production:"
SELECT 
  u.name as faculty_name,
  u.username,
  a1.dayOfWeek as day,
  a1.startTime || '-' || a1.endTime as time1,
  a1.name as appointment1,
  a2.startTime || '-' || a2.endTime as time2, 
  a2.name as appointment2,
  'CONFLICT' as issue
FROM "Appointment" a1
JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId 
  AND a1.dayOfWeek = a2.dayOfWeek 
  AND a1.id < a2.id
JOIN "Doorcard" d ON a1.doorcardId = d.id
JOIN "User" u ON d.userId = u.id
WHERE d.isActive = true
  AND ((a1.startTime < a2.endTime AND a1.endTime > a2.startTime)
       OR (a1.startTime = a2.startTime))
ORDER BY u.name, a1.dayOfWeek, a1.startTime;

.print ""
.print "📊 OVERLAP SUMMARY:"
SELECT 
  COUNT(*) as total_overlaps,
  COUNT(DISTINCT u.username) as affected_faculty
FROM "Appointment" a1
JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId 
  AND a1.dayOfWeek = a2.dayOfWeek 
  AND a1.id < a2.id
JOIN "Doorcard" d ON a1.doorcardId = d.id
JOIN "User" u ON d.userId = u.id
WHERE d.isActive = true
  AND (a1.startTime < a2.endTime AND a1.endTime > a2.startTime);

.print ""
.print "⚠️  MISSING OFFICE HOURS:"
.print "Faculty without office hours (potential issue):"
SELECT 
  u.name,
  u.username,
  COUNT(a.id) as total_appointments,
  COUNT(CASE WHEN a.category = 'OFFICE_HOURS' THEN 1 END) as office_hours_count
FROM "User" u
JOIN "Doorcard" d ON u.id = d.userId AND d.isActive = true
LEFT JOIN "Appointment" a ON d.id = a.doorcardId
GROUP BY u.id, u.name, u.username
HAVING COUNT(CASE WHEN a.category = 'OFFICE_HOURS' THEN 1 END) = 0
  AND COUNT(a.id) > 0
ORDER BY total_appointments DESC;

.print ""
.print "📈 SYSTEM HEALTH METRICS:"

-- Total counts
SELECT 'Active Faculty' as metric, COUNT(*) as count
FROM "User" u
JOIN "Doorcard" d ON u.id = d.userId 
WHERE d.isActive = true
UNION ALL
SELECT 'Total Appointments' as metric, COUNT(*) as count
FROM "Appointment" a
JOIN "Doorcard" d ON a.doorcardId = d.id
WHERE d.isActive = true
UNION ALL
SELECT 'Office Hours Appointments' as metric, COUNT(*) as count
FROM "Appointment" a
JOIN "Doorcard" d ON a.doorcardId = d.id
WHERE d.isActive = true AND a.category = 'OFFICE_HOURS'
UNION ALL
SELECT 'Faculty with Office Hours' as metric, COUNT(DISTINCT u.id) as count
FROM "User" u
JOIN "Doorcard" d ON u.id = d.userId AND d.isActive = true
JOIN "Appointment" a ON d.id = a.doorcardId
WHERE a.category = 'OFFICE_HOURS';

.print ""
.print "🏫 COLLEGE DISTRIBUTION:"
SELECT 
  d.college,
  COUNT(DISTINCT u.id) as faculty_count,
  COUNT(a.id) as appointment_count
FROM "User" u
JOIN "Doorcard" d ON u.id = d.userId AND d.isActive = true
LEFT JOIN "Appointment" a ON d.id = a.doorcardId
GROUP BY d.college
ORDER BY faculty_count DESC;

.print ""
.print "🕐 APPOINTMENT TIME ANALYSIS:"
SELECT 
  a.startTime,
  COUNT(*) as appointment_count,
  COUNT(DISTINCT d.userId) as faculty_count
FROM "Appointment" a
JOIN "Doorcard" d ON a.doorcardId = d.id
WHERE d.isActive = true
GROUP BY a.startTime
HAVING COUNT(*) > 5
ORDER BY a.startTime;

.print ""
.print "❗ DATA QUALITY ISSUES:"
-- Appointments with missing/invalid data
SELECT 'Appointments missing names' as issue, COUNT(*) as count
FROM "Appointment" a
JOIN "Doorcard" d ON a.doorcardId = d.id
WHERE d.isActive = true AND (a.name IS NULL OR a.name = '')
UNION ALL
SELECT 'Appointments missing locations' as issue, COUNT(*) as count  
FROM "Appointment" a
JOIN "Doorcard" d ON a.doorcardId = d.id
WHERE d.isActive = true AND (a.location IS NULL OR a.location = '')
UNION ALL
SELECT 'Invalid time ranges' as issue, COUNT(*) as count
FROM "Appointment" a 
JOIN "Doorcard" d ON a.doorcardId = d.id
WHERE d.isActive = true AND a.startTime >= a.endTime;

.print ""
.print "🎯 PRODUCTION READINESS SCORE:"
.print "CRITICAL ISSUES MUST BE 0 FOR PRODUCTION DEPLOYMENT"
.print ""