# EduTrack — Lessons & Workflow Rules

## Workflow Rules (set by user)

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Offload research, exploration, parallel analysis to subagents
- One focused task per subagent — keep main context clean

### 3. Self-Improvement Loop
- After ANY user correction: update tasks/lessons.md with the pattern
- Write rules that prevent the same mistake recurring
- Review lessons at session start

### 4. Verification Before Done
- Never mark complete without proving it works
- Ask: "Would a staff engineer approve this?"
- Run builds, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- Non-trivial changes: "is there a more elegant way?"
- Hacky fix? Implement the elegant solution instead
- Skip for simple obvious fixes — don't over-engineer

### 6. Autonomous Bug Fixing
- Bug report → just fix it, no hand-holding
- Zero context switching required from user

---

## Task Management Protocol
1. Plan First → tasks/todo.md with checkable items
2. Verify Plan before implementing
3. Track Progress: mark items complete as you go
4. Explain Changes: high-level summary at each step
5. Capture Lessons: update this file after corrections

---

## Core Principles
- Simplicity First: minimal code impact
- No Laziness: find root causes, senior developer standards
- Minimal Impact: only touch what is necessary

---

## Lessons Learned

### L1 — Auth Listener Re-subscription Race Condition
**Mistake**: `[currentSessionId]` in useEffect dependency for onAuthStateChanged caused the listener to re-register every login.
**Fix**: useRef instead of useState for session tracking. Dependency array = [].
**Rule**: Auth listeners must NEVER re-subscribe due to internal state. Use refs for internal tracking.

### L2 — schoolId Missing on New Documents After Migration
**Mistake**: addDoc calls in EleveForm, Classes.tsx didn't include schoolId → new docs invisible to schoolId-filtered queries.
**Fix**: Every addDoc must include schoolId from useTenant(). normalizeEleve passes through schoolId.
**Rule**: Any Firestore document creation MUST include schoolId. Pass via useTenant() in components, or as parameter in services.

### L3 — Auth Callback Not Resilient
**Mistake**: getDoc() in onAuthStateChanged had no try/catch → if it threw, setLoading(false) never called → infinite loading.
**Fix**: Wrap entire async IIFE in try/catch, always call setUser(null) + setLoading(false) on failure.
**Rule**: Firebase async callbacks must call state setters in BOTH success AND failure paths.

### L4 — Migration Must Be Transparent
**Mistake**: Required manual "Lancer la migration" button click.
**Fix**: Dashboard auto-runs migration once via localStorage key edutrack_migrated_v2. Silent.
**Rule**: Internal data migration never requires user action. Use localStorage or Firestore flags.

### L5 — YAGNI: Remove What's Not Needed Now
**Mistake**: Kept speculative SaaS features (landing pages, superadmin, billing, transport, library, HR, LMS).
**Fix**: Deleted all orphaned files, removed routes.
**Rule**: Don't build or keep features the user hasn't asked for. Removing a feature = delete the file.

### L6 — Windows Git Path Casing
**Mistake**: Edited files via lowercase src/pages/ path; git staged nothing (tracked as src/Pages/).
**Fix**: Always use exact casing from `git status` when staging.
**Rule**: On Windows, confirm file casing with git status before git add.
