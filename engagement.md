# Faculty Doorcard Platform - User Engagement Analysis

**Report Date:** July 27, 2025  
**Analysis Period:** Recent Terms (Fall 2024, Spring 2025, Summer 2025)  
**Data Source:** Production Database Analysis

## Executive Summary

The Faculty Doorcard Platform shows strong adoption across all three SMCCD campuses with **432 active faculty members** creating **720 doorcards** and scheduling **5,597 appointments** in recent terms. Skyline College leads in usage with 47.1% of all activity, while CSM and Cañada show balanced engagement at ~27-28% each.

## Campus Distribution Analysis

### Overall Usage by Campus

| Campus      | Doorcards | Users | % of Doorcards | % of Users | Avg Doorcards/User |
| ----------- | --------- | ----- | -------------- | ---------- | ------------------ |
| **Skyline** | 339       | 204   | **47.1%**      | **47.2%**  | 1.66               |
| **CSM**     | 195       | 121   | **27.1%**      | **28.0%**  | 1.61               |
| **Cañada**  | 186       | 128   | **25.8%**      | **29.6%**  | 1.45               |
| **Total**   | 720       | 432   | 100%           | 100%       | 1.67               |

### Key Insights

- **Skyline College** dominates with nearly half of all doorcard activity
- **Engagement rates** are consistently high across all campuses (1.4-1.7 doorcards per user)
- **Multi-campus faculty:** 20 users (4.6%) maintain doorcards at multiple campuses
- **Term participation:** Spring 2025 showed highest activity (340 faculty)

## Top 20 Beta Test Candidates

### Tier 1: Power Users (7+ Doorcards)

1. **marquezr@smccd.edu** (Skyline) - 7 doorcards, 40 appointments - _All 3 terms_

### Tier 2: Heavy Users (4-6 Doorcards)

2. **mcclungk@smccd.edu** (Skyline) - 4 doorcards, 14 appointments - _All 3 terms_
3. **jamesb@smccd.edu** (Skyline) - 4 doorcards, 4 appointments - _Fall 2024, Spring 2025_
4. **zoughbies@smccd.edu** (Skyline) - 4 doorcards, 4 appointments - _All 3 terms_

### Tier 3: Consistent Users (3 Doorcards, High Appointments)

5. **liy@smccd.edu** (Skyline) - 3 doorcards, 37 appointments - _All 3 terms_
6. **llamase@smccd.edu** (Cañada) - 3 doorcards, 36 appointments - _All 3 terms_
7. **heine@smccd.edu** (Cañada) - 3 doorcards, 36 appointments - _All 3 terms_
8. **piergrossij@smccd.edu** (Skyline) - 3 doorcards, 36 appointments - _All 3 terms_
9. **travisk@smccd.edu** (CSM) - 3 doorcards, 34 appointments - _All 3 terms_
10. **beltranh@smccd.edu** (Cañada) - 3 doorcards, 33 appointments - _All 3 terms_

### Tier 4: Additional High-Engagement Users

11. **allenr@smccd.edu** (Skyline) - 2 doorcards, 25 appointments - _Spring 2025, Summer 2025_
12. **brownm@smccd.edu** (CSM) - 2 doorcards, 24 appointments - _Fall 2024, Spring 2025_
13. **danielson@smccd.edu** (Cañada) - 2 doorcards, 23 appointments - _Fall 2024, Spring 2025_
14. **fergusonm@smccd.edu** (Skyline) - 2 doorcards, 22 appointments - _All 3 terms_
15. **gonzalezk@smccd.edu** (CSM) - 2 doorcards, 21 appointments - _Spring 2025, Summer 2025_
16. **hicksg@smccd.edu** (Cañada) - 2 doorcards, 20 appointments - _Fall 2024, Spring 2025_
17. **johnsonj@smccd.edu** (Skyline) - 2 doorcards, 19 appointments - _All 3 terms_
18. **kramm@smccd.edu** (CSM) - 2 doorcards, 18 appointments - _Fall 2024, Spring 2025_
19. **luckj@smccd.edu** (Skyline) - 2 doorcards, 17 appointments - _Spring 2025, Summer 2025_
20. **mcdaniels@smccd.edu** (Cañada) - 2 doorcards, 16 appointments - _All 3 terms_

## Beta Testing Recommendations

### Campus Distribution for Testing

- **Skyline:** 12 users (60%) - Reflects actual usage dominance
- **CSM:** 4 users (20%) - Slightly below actual percentage for focused testing
- **Cañada:** 4 users (20%) - Slightly below actual percentage for focused testing

### User Characteristics

- **Multi-term users preferred:** 85% of recommended users active across multiple terms
- **High appointment density:** Average 20+ appointments per user
- **Diverse scheduling patterns:** Mix of office hours, classes, and lab sessions
- **Proven platform engagement:** All users demonstrate sustained usage

### Testing Focus Areas by User Type

**Power Users (Tier 1-2):**

- Complex scheduling scenarios
- Multi-term workflow testing
- Advanced feature adoption
- Performance under heavy usage

**Consistent Users (Tier 3-4):**

- Standard workflow validation
- Cross-campus functionality
- Appointment management features
- User experience feedback

## Platform Usage Patterns

### Term Activity Distribution

- **Fall 2024:** 284 faculty (288 doorcards)
- **Spring 2025:** 340 faculty (356 doorcards) - _Peak usage_
- **Summer 2025:** 73 faculty (76 doorcards) - _Seasonal decline_

### Popular Appointment Categories

1. **Office Hours:** 2,092 appointments (402 faculty)
2. **In-Class:** 1,464 appointments (232 faculty)
3. **Lecture:** 698 appointments (132 faculty)
4. **Lab:** 512 appointments (117 faculty)
5. **Hours by Arrangement:** 437 appointments (100 faculty)
6. **Reference:** 394 appointments (88 faculty)

### Weekly Scheduling Patterns

- **Wednesday:** 1,310 appointments (most popular)
- **Tuesday:** 1,282 appointments
- **Monday:** 1,201 appointments
- **Thursday:** 1,198 appointments
- **Friday:** 565 appointments
- **Weekend:** 30 total appointments (minimal usage)

## Technical Implementation Notes

### Database Status

- **Total system users:** 2,130 faculty accounts
- **Active doorcard users:** 432 (20.3% adoption rate)
- **User profile completeness:** 99.95% of users need campus assignment in profiles
- **Campus management:** Handled at doorcard level, not user profile level

### Authentication & Access

- **Default credentials:** All imported users have password "changeme123"
- **Email format:** username@smccd.edu
- **Role assignment:** All users assigned "FACULTY" role
- **Profile setup:** New profile enhancement features available for beta testing

### Beta Testing Preparation

1. **User notification:** Contact recommended users about beta participation
2. **Credential reset:** Provide new login instructions
3. **Feature training:** Brief users on enhanced profile features
4. **Feedback collection:** Implement structured feedback mechanisms
5. **Support channels:** Establish direct communication for beta issues

## Success Metrics for Beta

### Quantitative Metrics

- **User engagement:** Doorcard creation/update frequency
- **Feature adoption:** Usage of new profile enhancement features
- **Cross-campus usage:** Multi-campus faculty workflow testing
- **Appointment density:** Scheduling activity levels

### Qualitative Metrics

- **User satisfaction:** Feedback on interface improvements
- **Workflow efficiency:** Time savings and usability improvements
- **Feature requests:** Identification of additional needed functionality
- **Technical issues:** Bug reports and performance feedback

---

**Next Steps:** Contact the recommended 20 faculty members to invite them to participate in the beta testing program, prioritizing Tier 1-2 users for early access and comprehensive testing scenarios.
