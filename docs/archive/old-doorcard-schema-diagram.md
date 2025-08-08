# Old Doorcard Database Schema Diagram

## Access Database Schema (Legacy System)

```mermaid
erDiagram
    TBL_USER {
        varchar username PK "Primary identifier"
        varchar userrole "User role (admin, faculty, staff)"
    }

    TBL_DOORCARD {
        integer doorcardID PK "Primary key (480-27,228)"
        varchar username FK "Foreign key to TBL_USER"
        varchar doorcardname "Display name for doorcard"
        datetime doorstartdate "Term start date"
        datetime doorenddate "Term end date"
        integer doorterm "Term code (YYYYMM format)"
        varchar college "College (CSM, Skyline, Canada, District)"
    }

    TBL_APPOINTMENT {
        integer appointID PK "Primary key"
        integer catID FK "Foreign key to TBL_CATEGORY"
        varchar username FK "Foreign key to TBL_USER (can be empty)"
        integer doorcardID FK "Foreign key to TBL_DOORCARD"
        varchar appointname "Appointment/class name"
        datetime appointstarttime "Start time (dummy date 12/30/99)"
        datetime appointendtime "End time (dummy date 12/30/99)"
        varchar appointday "Day of week"
    }

    TBL_CATEGORY {
        integer catID PK "Primary key (1-7)"
        varchar catname "Category display name"
        varchar catcolor "Hex color code for UI"
    }

    TBL_TEMPLATE {
        integer tempID PK "Template ID"
        varchar temptitle "Template title"
        varchar templogo "Logo reference"
        varchar tempfont "Font specification"
        varchar tempfontcolor "Font color"
        varchar temptablecolor "Table color"
    }

    %% Relationships
    TBL_USER ||--o{ TBL_DOORCARD : "creates"
    TBL_USER ||--o{ TBL_APPOINTMENT : "owns"
    TBL_DOORCARD ||--o{ TBL_APPOINTMENT : "contains"
    TBL_CATEGORY ||--o{ TBL_APPOINTMENT : "categorizes"

    %% External Systems
    LDAP_AD {
        varchar username "Active Directory username"
        varchar firstname "First name"
        varchar lastname "Last name"
        varchar email "Email address"
        varchar title "Job title"
        varchar department "Department"
        varchar college "College affiliation"
    }

    SQL_SERVER {
        varchar profile_pics "Profile picture storage"
        varchar authentication "User authentication"
    }

    %% External Relationships
    LDAP_AD ||--o{ TBL_USER : "provides user data"
    SQL_SERVER ||--|| TBL_USER : "stores profiles"
```

## Data Statistics & Issues

### Table Record Counts

| Table           | Records | Issues                              |
| --------------- | ------- | ----------------------------------- |
| TBL_USER        | 1       | 99.96% missing (expected: 2,271)    |
| TBL_DOORCARD    | 10,944  | 22 invalid dates, 85+ missing dates |
| TBL_APPOINTMENT | 184,935 | 88,000+ orphaned (53.6% broken FKs) |
| TBL_CATEGORY    | 7       | Complete                            |
| TBL_TEMPLATE    | 0       | Empty file                          |

### Category Distribution

```
Office Hours (#E1E2CA)          █████████████████████████████████████ 37.2%
In Class (#99B5D5)              ███████████████████████████████████   33.4%
Lecture (#D599C5)               ███████████                           10.6%
Lab (#EDAC80)                   ████████                              7.6%
Hours by Arrangement (#99D5A1)  ██████                                6.0%
Reference (#AD99D5)             █████                                 4.8%
[UNDEFINED]                     █                                     0.4%
```

### College Distribution

```
CSM (College of San Mateo)      ████████████████████████████████████████ 45.2%
Skyline                         ██████████████████████████████████       38.1%
Canada                          ███████████████                          16.4%
District                        █                                        0.3%
```

## Critical Data Integrity Problems

### 🔴 Broken Foreign Key Relationships

- **53.6%** of appointments reference non-existent doorcard IDs
- Only **9,370** doorcard IDs exist in both tables
- Complete breakdown of relational integrity

### 🔴 Missing User Data

- Only **1 user** in TBL_USER vs **2,271** users referenced
- **99.96%** of user records missing from export
- Indicates incomplete database export

### 🔴 Data Quality Issues

- **22** records with invalid dates (`01/00/00 00:00:00`)
- **70** appointments with empty usernames
- **792** appointments with undefined categories
- Inconsistent naming conventions

## Architecture Notes

### Legacy System Components

1. **PHP Web Application** (`old-doorcard/public/`)
   - LDAP authentication via `ldap_connection.php`
   - SQL Server integration for profiles
   - Direct database queries in PHP files

2. **Database Access Methods**
   - ODBC connections to SQL Server
   - LDAP queries for user information
   - CSV exports from Access database

3. **Extraction Tools Built**
   - `extract-access-db.py` (Python with mdbtools/pyodbc)
   - `extract-access-db.js` (Node.js with node-adodb)
   - `extract-access-simple.sh` (Bash with mdbtools)

### Migration Path to Modern Stack

```mermaid
flowchart LR
    A[Legacy Access DB] --> B[CSV Extraction]
    B --> C[Data Validation]
    C --> D[Prisma Migration]
    D --> E[Next.js App]

    F[LDAP/AD] --> G[User Data Export]
    G --> C

    H[SQL Server] --> I[Profile Pictures]
    I --> C

    subgraph "Data Issues"
        J[Fix Foreign Keys]
        K[Clean Invalid Dates]
        L[Handle Missing Users]
        M[Standardize Colleges]
    end

    C --> J
    C --> K
    C --> L
    C --> M
```

## Recommended Actions

1. **🔥 Critical**: Obtain complete user export from Active Directory/LDAP
2. **⚡ High**: Fix foreign key relationships between appointments and doorcards
3. **⚡ High**: Clean invalid date formats and handle empty values
4. **📊 Medium**: Define missing category #7 and standardize college names
5. **🔧 Low**: Implement template system migration (currently unused)

---

**Generated from analysis of Access DB exports in**: `db-items/`, `rejects/`,
and migration scripts in `scripts/`
