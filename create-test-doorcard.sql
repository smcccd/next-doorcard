-- Create test user and doorcard
INSERT INTO "User" (id, name, email, role, college, password, "firstName", "lastName", "updatedAt") 
VALUES ('test-user-1', 'Dr. Test Faculty', 'test@smccd.edu', 'FACULTY', 'SKYLINE', null, 'Test', 'Faculty', NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO "Doorcard" (id, name, "doorcardName", "officeNumber", term, year, college, "isActive", "isPublic", "userId", "updatedAt") 
VALUES ('test-doorcard-1', 'Dr. Test Faculty', 'Fall 2024 Doorcard', 'Room 101', 'FALL', 2024, 'SKYLINE', true, true, 'test-user-1', NOW())
ON CONFLICT (id) DO NOTHING;