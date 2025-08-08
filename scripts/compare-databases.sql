-- 1. Overall counts comparison
.print "=== DATABASE COMPARISON SUMMARY ==="
.print ""

-- Legacy data (from CSV)
ATTACH DATABASE 'legacy_comparison.db' AS legacy;
ATTACH DATABASE 'prisma/dev.db' AS current;

.print "LEGACY SYSTEM (Access DB via CSV):"
SELECT 
  'Users' as type, COUNT(*) as count 
FROM legacy.legacy_users
UNION ALL
SELECT 
  'Doorcards' as type, COUNT(*) as count 
FROM legacy.legacy_doorcards  
UNION ALL
SELECT 
  'Appointments' as type, COUNT(*) as count 
FROM legacy.legacy_appointments;

.print ""
.print "CURRENT SYSTEM (SQLite):"
SELECT 
  'Users' as type, COUNT(*) as count 
FROM current."User"
UNION ALL
SELECT 
  'Doorcards' as type, COUNT(*) as count 
FROM current."Doorcard"
UNION ALL
SELECT 
  'Appointments' as type, COUNT(*) as count 
FROM current."Appointment";

.print ""
.print "=== DR. JUDITH MILLER COMPARISON ==="
.print ""
.print "LEGACY: Dr. Miller appointments"
SELECT 
  appointname as name,
  appointday as day,
  appointstarttime as start_time,
  appointendtime as end_time
FROM legacy.legacy_appointments 
WHERE username = 'millerj'
ORDER BY appointday, appointstarttime
LIMIT 10;

.print ""
.print "CURRENT: Dr. Miller appointments"
SELECT 
  a.name,
  a.dayOfWeek as day,
  a.startTime,
  a.endTime
FROM current."Appointment" a
JOIN current."Doorcard" d ON a.doorcardId = d.id
JOIN current."User" u ON d.userId = u.id
WHERE u.username = 'millerj'
ORDER BY a.dayOfWeek, a.startTime;

.print ""
.print "=== DATA QUALITY COMPARISON ==="
.print ""
.print "LEGACY: Duplicate appointments"
SELECT 
  username,
  appointstarttime,
  appointendtime,
  COUNT(*) as duplicate_count
FROM legacy.legacy_appointments
GROUP BY username, appointstarttime, appointendtime, appointname
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 5;

.print ""
.print "CURRENT: Duplicate appointments"
SELECT 
  u.username,
  a.startTime,
  a.endTime,
  COUNT(*) as duplicate_count
FROM current."Appointment" a
JOIN current."Doorcard" d ON a.doorcardId = d.id
JOIN current."User" u ON d.userId = u.id
GROUP BY u.username, a.startTime, a.endTime, a.name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 5;