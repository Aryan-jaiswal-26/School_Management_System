# School / Academic CRUD Test Report

Date: 2026-06-01  
Scope: School profile, academic year, terms, classes, sections, subjects, timetables, and school calendar.

## What Was Verified

- School profile `GET` / `PATCH`
- Academic year `POST` / `GET` / `PATCH` / `DELETE`
- Terms `POST` / `PATCH` / `DELETE`
- Classes `POST` / `GET` / `PATCH` / `DELETE`
- Sections `POST` / `PATCH` / `DELETE`
- Subjects `POST` / `PATCH` / `DELETE`
- Timetables `POST` / `PATCH` / `DELETE`
- School calendar events `POST` / `PATCH` / `DELETE`
- Relationship chain: `School → Class → Section → Subject → Timetable`

## Smoke Test Result

All verification steps completed successfully against the live API on `http://localhost:5000`.

| Step | Result |
|---|---|
| Login as school admin | Pass |
| Read school profile | Pass |
| Update school profile | Pass |
| Create academic year | Pass |
| List academic years | Pass |
| Update academic year | Pass |
| Create term | Pass |
| Update term | Pass |
| Create class | Pass |
| List classes | Pass |
| Update class | Pass |
| Hire teacher employee for timetable linkage | Pass |
| List employees | Pass |
| Create section | Pass |
| Update section | Pass |
| Create subject | Pass |
| Update subject | Pass |
| Create timetable | Pass |
| Update timetable | Pass |
| Create calendar event | Pass |
| Update calendar event | Pass |
| Delete calendar event | Pass |
| Delete timetable | Pass |
| Delete subject | Pass |
| Delete section | Pass |
| Delete class | Pass |
| Delete term | Pass |
| Delete academic year | Pass |
| Restore school profile | Pass |

## Notes

- The school/term payload validators were adjusted to match the existing frontend payloads:
  - `schoolId` is derived from the route context, so it is optional in request bodies.
  - Academic year and term dates now accept coerced date values from the UI.
- A temporary teacher employee was created during verification to satisfy the timetable foreign-key chain. The system currently has no employee delete route, so that QA employee remains in the database.
- Frontend authorization is wired in `src/routes/admin.school.tsx` via role gating and redirect handling, and `schoolId` is propagated through auth context for school-scoped CRUD.

## Files Touched In This Pass

- `backend/src/validations/school.validation.ts`
- `ACADEMICS_CRUD_TEST_REPORT_2026-06-01.md`
