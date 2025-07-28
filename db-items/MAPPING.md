# CSV to Prisma Schema Mapping

## TBL_USER (2).csv
| Legacy Column | ↔ | Prisma Field | Notes |
|---------------|---|--------------|-------|
| username | → | User.username | Direct mapping |
| userrole | → | User.role | ① Transform: Map to UserRole enum (FACULTY/ADMIN/STAFF) |

**Missing fields in Prisma User model that need to be populated:**
- id (will be auto-generated)
- name (① Add new field to CSV or derive from username)
- email (① Add new field to CSV - REQUIRED)
- password (① Add new field to CSV - REQUIRED)
- college (① Add new field to CSV or derive from other data)

---

## TBL_DOORCARD (1).csv
| Legacy Column | ↔ | Prisma Field | Notes |
|---------------|---|--------------|-------|
| doorcardID | → | Doorcard.id | ① Transform: Convert numeric ID to cuid() |
| username | → | Doorcard.userId | ① Transform: Lookup User.id from username |
| doorcardname | → | Doorcard.doorcardName | Direct mapping |
| doorstartdate | → | - | ② No direct mapping - might inform term/year |
| doorenddate | → | - | ② No direct mapping - might inform term/year |
| doorterm | → | Doorcard.term + year | ① Transform: Parse term string to extract TermSeason enum and year |
| college | → | Doorcard.college | ① Transform: Map to College enum (SKYLINE/CSM/CANADA) |

**Missing fields in Prisma Doorcard model:**
- name (① Derive from User.name or use doorcardname)
- officeNumber (① Add new field to CSV or set default)
- isActive (Set based on dates or default false)
- isPublic (Default false)
- slug (Generate from name/term/year)

---

## TBL_APPOINTMENT (1).csv
| Legacy Column | ↔ | Prisma Field | Notes |
|---------------|---|--------------|-------|
| appointID | → | Appointment.id | ① Transform: Convert numeric ID to cuid() |
| catID | → | Appointment.category | ① Transform: Map numeric catID to AppointmentCategory enum |
| username | → | - | ② Used to link via doorcard |
| doorcardID | → | Appointment.doorcardId | ① Transform: Map old numeric ID to new cuid() |
| appointname | → | Appointment.name | Direct mapping |
| appointstarttime | → | Appointment.startTime | ① Transform: Extract time portion only |
| appointendtime | → | Appointment.endTime | ① Transform: Extract time portion only |
| appointday | → | Appointment.dayOfWeek | ① Transform: Map to DayOfWeek enum |

**Missing fields:**
- location (① Extract from appointname if contains room info, or set null)

---

## TBL_CATEGORY (1).csv
| Legacy Column | ↔ | Prisma Field | Notes |
|---------------|---|--------------|-------|
| catID | → | - | ② Used for mapping to AppointmentCategory enum |
| catname | → | AppointmentCategory | ① Transform rule: Create mapping table |
| catcolor | → | - | ② No color field in new schema |

**Suggested category mapping:**
- catID 1 → OFFICE_HOURS
- catID 2 → IN_CLASS
- catID 3 → LECTURE
- catID 4 → LAB
- catID 5 → HOURS_BY_ARRANGEMENT
- catID 6 → REFERENCE
- catID 7 → (need to check data)

---

## TBL_TEMPLATE (1).csv
| Legacy Column | ↔ | Prisma Field | Notes |
|---------------|---|--------------|-------|
| tempID | → | - | ② No template model in new schema |
| temptitle | → | - | ② No template model in new schema |
| templogo | → | - | ② No template model in new schema |
| tempfont | → | - | ② No template model in new schema |
| tempfontcolor | → | - | ② No template model in new schema |
| temptablecolor | → | - | ② No template model in new schema |

**Note:** Template data has no corresponding model in the new schema. This data will be lost unless a Template model is added.

---

## Migration Steps Required:

1. **User Migration**:
   - Need to generate email addresses (required field)
   - Need to generate secure passwords (required field)
   - Map userrole to UserRole enum
   - Potentially need to assign college

2. **Doorcard Migration**:
   - Parse doorterm to extract term season and year
   - Link to User via username lookup
   - Generate slug from name/term/year
   - Set default values for missing fields

3. **Appointment Migration**:
   - Map catID to AppointmentCategory enum
   - Convert day names to DayOfWeek enum
   - Extract time portions from datetime strings
   - Link to Doorcard via ID mapping

4. **Data Transformation Rules**:
   - Date/Time: Legacy uses "12/30/99 HH:MM:SS" format
   - IDs: Convert numeric IDs to cuid() format
   - Maintain ID mapping table for relationships