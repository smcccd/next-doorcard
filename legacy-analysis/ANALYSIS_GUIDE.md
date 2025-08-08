# Legacy Classic ASP Analysis Guide

## Security Precautions

1. **DO NOT** commit any legacy ASP files to git
2. **REMOVE** all connection strings, API keys, passwords before analysis
3. **SANITIZE** any sensitive data in code samples

## What I'll Focus On

### 1. Core Features (without seeing secrets)

- Page structure and navigation flow
- Form inputs and data collection
- Business logic and workflows
- User roles and permissions (structure only)
- Database schema (tables, fields - no data)

### 2. Safe Analysis Areas

- URL routes and page names
- HTML form structures
- Client-side JavaScript functionality
- CSS and styling approaches
- File upload/download features
- Print functionality
- Search capabilities

### 3. Feature Mapping Template

Create a file like this for each major feature:

```
FEATURE: [Name]
LEGACY FILES: [List ASP files involved]
DESCRIPTION: [What it does]
USER FLOW: [Step by step process]
DATA FIELDS: [Form fields, no actual data]
BUSINESS RULES: [Logic without implementation details]
NEW APP STATUS: [Implemented/Missing/Partial]
```

## How to Prepare Legacy Code for Analysis

1. **Create sanitized copies**:
   - Replace all connection strings with "REDACTED"
   - Remove actual passwords/keys
   - Keep structure but remove sensitive values

2. **Focus on these file types**:
   - .asp files (main logic)
   - .inc files (includes)
   - .js files (client-side)
   - .css files (styling)
   - Global.asa (application config - sanitized)

3. **Document the structure**:
   ```
   /legacy
     /admin (admin features)
     /includes (shared code)
     /images (UI assets)
     /scripts (JavaScript)
     /styles (CSS)
     default.asp (home page)
     login.asp (auth)
     etc...
   ```

## Questions to Answer

1. What are the main user types/roles?
2. What's the core workflow (login → create doorcard → publish)?
3. What data is collected for each doorcard?
4. Are there any scheduling/calendar features?
5. What reports or analytics exist?
6. How are prints/exports handled?
7. Any email notifications?
8. Search functionality details?
9. File upload requirements?
10. Integration points with other systems?

## Safe Code Snippet Example

Instead of:

```asp
connStr = "Server=prod.server;Database=DoorCards;UID=admin;PWD=Pass123"
```

Provide:

```asp
connStr = "REDACTED_CONNECTION_STRING"
```

This way I can understand the functionality without seeing secrets.
