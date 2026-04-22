# Dev Team - Full Orchestration

Orchestrate the full virtual developer team to complete this task: $ARGUMENTS

## Project Tech Stack
- Frontend: React + Next.js + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Deployment: Docker Compose
- Refer to `.claude/skills/` for detailed conventions and patterns

## Documents (shared state between agents)
All agents communicate through files in `Document/`:
| File | Written by | Read by |
|------|-----------|---------|
| `Document/Solution.md` | Architect | Dev, QA |
| `Document/Tasks.md` | Architect | Dev (pick & update status) |
| `Document/TestPlan.md` | QA | — |
| `Document/Bug.md` | QA | Dev (fix & update status) |

---

## Phase 1: Architecture & Planning
Launch an **Architect** agent (subagent_type: Plan) to:
- Analyze the request and existing codebase
- Design system architecture following the project's layered pattern (Routes → Controllers → Services → Models)
- Define file structure under `front-end/src/` and `back-end/src/`
- Define database schema (PostgreSQL with UUID keys, timestamptz)
- Define API contracts between frontend and backend
- Break down into concrete tasks with dependencies
- **Write** `Document/Solution.md` with the full solution design
- **Write** `Document/Tasks.md` with all tasks in `TODO` status

Wait for the Architect to finish before proceeding.

---

## Phase 2: Implementation (Parallel)
Launch **Backend Dev** and **Frontend Dev** agents in parallel:

**Backend Dev** (subagent_type: general-purpose):
- Read `Document/Solution.md` and `Document/Tasks.md`
- Pick backend/both tasks with status `TODO`, mark as `IN_PROGRESS`, implement, mark as `DONE`
- Follow: Routes → Controllers → Services → Models
- Express + TypeScript, Zod validation, parameterized SQL queries
- Read `.claude/skills/backend/SKILL.md` and `.claude/skills/database/SKILL.md` for patterns

**Frontend Dev** (subagent_type: general-purpose):
- Read `Document/Solution.md` and `Document/Tasks.md`
- Pick frontend/both tasks with status `TODO`, mark as `IN_PROGRESS`, implement, mark as `DONE`
- React + Next.js (App Router) + TypeScript, Server Components by default
- Read `.claude/skills/frontend/SKILL.md` for patterns

Wait for both devs to finish before proceeding.

---

## Phase 3: Code Review
Launch a **Code Reviewer** agent (subagent_type: general-purpose) to:
- Read ALL created/modified files
- Check for SQL injection, XSS, auth bypass, exposed secrets
- Verify frontend API calls match backend endpoints (cross-check with `Document/Solution.md`)
- Verify TypeScript strict mode compliance
- **Fix issues directly** - don't just report them

---

## Phase 4: QA Testing
Launch a **QA Tester** agent (subagent_type: general-purpose) to:
- Read `Document/Solution.md` and `Document/Tasks.md`
- Write `Document/TestPlan.md` with all test cases
- Run tests, update each test case status (PASS/FAIL)
- Write failing tests as bugs to `Document/Bug.md`

---

## Phase 5: Bug Fix (if bugs exist)
After QA finishes, check `Document/Bug.md`:
- If there are bugs with **Status** `OPEN`, launch Backend Dev and/or Frontend Dev agents to fix them
- Each dev reads `Document/Bug.md`, fixes assigned bugs, marks them `FIXED`
- Re-run QA on fixed areas if needed

---

## Phase 6: Docker & Summary
- Ensure `docker-compose.yml`, Dockerfiles, and `.dockerignore` are correct
- Read `.claude/skills/devops/SKILL.md` for Docker patterns
- Report final status:
  - Tasks completed (from `Document/Tasks.md`)
  - Test results (from `Document/TestPlan.md`)
  - Bugs found/fixed (from `Document/Bug.md`)
  - Architecture decisions and known limitations
