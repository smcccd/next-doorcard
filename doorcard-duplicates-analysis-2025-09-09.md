# Doorcard Duplicate Analysis Report

Generated: 2025-09-09T02:23:51.939Z

## Summary

- Total doorcards: 218
- Unique combinations (user/college/term/year): 218
- Combinations with duplicates: 0
- Total duplicate doorcards: 0

## Categorization

- Likely test/seed data: 0 groups (0 doorcards)
- Likely real data: 0 groups (0 doorcards)
- Uncertain (no analytics): 0 groups (0 doorcards)

## Recommendations

### For Test Data:

- Can be safely cleaned up by keeping only the most recent active doorcard
- Consider deleting all inactive test doorcards

### For Real User Data:

- Merge appointments from all doorcards into the active one (if exists)
- If no active doorcard, use the most recent one
- Archive the duplicate data before deletion

### For Uncertain Data:

- Review manually or check access logs
- Contact users if necessary
- Default to keeping most recent if no response
