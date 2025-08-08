# Feature Comparison: Legacy vs New Doorcard System

## Overview

- **Legacy System**: PHP-based employee directory with LDAP integration
- **New System**: Next.js doorcard application with local database

## Core Features Comparison

### 1. Authentication & User Management

| Feature            | Legacy (PHP/LDAP)   | New (Next.js)                    | Status         |
| ------------------ | ------------------- | -------------------------------- | -------------- |
| Login System       | LDAP authentication | NextAuth with multiple providers | ✅ Enhanced    |
| User Roles         | Basic (from LDAP)   | Admin, User with RBAC            | ✅ Enhanced    |
| Session Management | PHP sessions        | NextAuth sessions                | ✅ Improved    |
| Profile Management | LDAP data only      | Editable user profiles           | ✅ Enhanced    |
| Multi-factor Auth  | No                  | Possible with providers          | ✅ New Feature |

### 2. Directory & Search

| Feature            | Legacy          | New                    | Status         |
| ------------------ | --------------- | ---------------------- | -------------- |
| Employee Directory | Yes (from LDAP) | Yes (database)         | ✅ Implemented |
| Search by Name     | Yes             | Yes                    | ✅ Implemented |
| A-Z Index          | Yes             | No                     | ❌ **MISSING** |
| Department Filter  | Yes             | Yes (via appointments) | ✅ Implemented |
| College Filter     | Yes             | Yes                    | ✅ Implemented |
| Advanced Search    | Basic           | More options           | ✅ Enhanced    |

### 3. Doorcard/Profile Display

| Feature         | Legacy    | New                 | Status         |
| --------------- | --------- | ------------------- | -------------- |
| Profile Photo   | Yes       | Yes                 | ✅ Implemented |
| Office Location | From LDAP | Yes                 | ✅ Implemented |
| Office Hours    | No        | Yes                 | ✅ New Feature |
| Contact Info    | From LDAP | Customizable        | ✅ Enhanced    |
| Print View      | Basic     | Professional layout | ✅ Enhanced    |
| Public URL      | No        | Yes (slugs)         | ✅ New Feature |

### 4. Profile Photo Management

| Feature        | Legacy  | New              | Status         |
| -------------- | ------- | ---------------- | -------------- |
| Photo Upload   | Yes     | Yes              | ✅ Implemented |
| Photo Crop     | Yes     | No               | ❌ **MISSING** |
| Photo Delete   | Yes     | Yes              | ✅ Implemented |
| Format Support | JPG/PNG | Multiple formats | ✅ Enhanced    |
| Size Limits    | Unknown | Configured       | ✅ Implemented |

### 5. Data Management

| Feature           | Legacy     | New                | Status         |
| ----------------- | ---------- | ------------------ | -------------- |
| Data Source       | LDAP/AD    | Local Database     | ✅ Different   |
| Real-time Updates | Yes (LDAP) | Manual updates     | ⚠️ Trade-off   |
| Bulk Import       | No         | CSV import         | ✅ New Feature |
| Data Export       | No         | CSV export         | ✅ New Feature |
| Version History   | No         | Updated timestamps | ✅ Basic       |

### 6. Administrative Features

| Feature         | Legacy      | New           | Status         |
| --------------- | ----------- | ------------- | -------------- |
| Admin Panel     | No          | Comprehensive | ✅ New Feature |
| User Management | Via AD only | Full CRUD     | ✅ New Feature |
| Analytics       | No          | Built-in      | ✅ New Feature |
| Bulk Operations | No          | Yes           | ✅ New Feature |
| Term Management | No          | Yes           | ✅ New Feature |

### 7. Public Access & Sharing

| Feature                 | Legacy  | New           | Status         |
| ----------------------- | ------- | ------------- | -------------- |
| Public Directory        | Yes     | Yes           | ✅ Implemented |
| Individual Public Pages | Limited | Full doorcard | ✅ Enhanced    |
| Firewall Detection      | Yes     | No            | ❌ **MISSING** |
| Share Links             | No      | Yes           | ✅ New Feature |
| QR Codes                | No      | Possible      | 🔄 Potential   |

### 8. Technical Features

| Feature           | Legacy           | New             | Status         |
| ----------------- | ---------------- | --------------- | -------------- |
| Mobile Responsive | Limited          | Full responsive | ✅ Enhanced    |
| Dark Mode         | No               | Yes             | ✅ New Feature |
| Accessibility     | Basic            | WCAG compliant  | ✅ Enhanced    |
| Performance       | Server-side only | Optimized       | ✅ Enhanced    |
| SEO               | Basic            | Optimized       | ✅ Enhanced    |

## Missing Features to Implement

### High Priority

1. **A-Z Alphabetical Index** - Quick navigation by last name
2. **Photo Cropping Tool** - Allow users to crop uploaded photos
3. **LDAP Integration** - Optional sync with Active Directory
4. **Firewall/Network Detection** - Show different content based on network

### Medium Priority

5. **Bulk Photo Upload** - Admin feature for multiple photos
6. **Employee Import from AD** - Sync employee data
7. **Legacy URL Redirects** - Maintain old URLs
8. **Department Hierarchy** - Show org structure

### Low Priority

9. **Photo Gallery View** - Browse all faculty photos
10. **vCard Download** - Export contact as vCard
11. **Pronunciation Guide** - Name pronunciation field
12. **Office Maps** - Integration with campus maps

## Data Migration Considerations

### From LDAP/AD

- Employee names, titles, departments
- Office locations and phone numbers
- Email addresses
- Department/division structure

### From Legacy Database

- Existing doorcard configurations
- Profile photos (need to migrate files)
- Custom office hours
- Historical data

## Recommendations

1. **Implement A-Z Index** - Critical for large directories
2. **Add Photo Cropping** - User expectation from legacy
3. **Create LDAP Sync** - Optional feature for real-time data
4. **Setup Redirects** - Preserve SEO and bookmarks
5. **Migrate Photos** - Script to move existing profile photos
6. **Test with Users** - Ensure feature parity meets expectations

## Next Steps

1. Prioritize missing features based on user needs
2. Create migration scripts for photos and data
3. Implement high-priority missing features
4. Setup legacy URL redirect rules
5. Plan phased rollout with user training
