# Workflow Rules & Lessons Learned

## Multi-Tenancy

### Root cause of dashboard 0s
Docs created after the initial migration had no `schoolId` field. Because all queries now filter by `schoolId`, these docs were invisible.

### Fix pattern: auto-migrate on first dashboard load
In `getAdminDashboardStats` (and any stats function), call `migrateDataToSchool(schoolId)` right after resolving `schoolId`. This is a no-op once all docs have `schoolId`, so it adds negligible overhead after the first run.

```ts
const schoolId = await getSchoolId(context.auth!.uid);
try { await migrateDataToSchool(schoolId); } catch { /* silent */ }
```

### Single source of truth for schoolId
`getSchoolId(uid)` in `helpers/tenant.ts` is the canonical way to resolve schoolId in Cloud Functions. Never read it from client data or derive it elsewhere.

## Cleanup Rules

### Remove features before shipping
- Never ship UI for unimplemented or future-only features (landing page, superadmin panel, billing).
- Remove them from `App.tsx` lazy imports and routes at the same time as removing the pages.

### Migration button anti-pattern
Exposing a "run migration" button in the UI puts the burden on the user to notice and fix their data. Auto-migrate server-side instead (idempotent, silent, happens on first authenticated call).

## Build Verification

Run in this order after changes:
1. `cd functions && npm run build` — catch TypeScript errors in Cloud Functions
2. `npx vite build` — catch TypeScript/import errors in frontend
3. `npx firebase deploy --only functions:getAdminDashboardStats,hosting` — deploy only affected resources
4. Load dashboard → verify counts appear on first load (no manual action needed)
5. Navigate to `/landing`, `/pricing`, `/superadmin` → confirm redirect to `/`
