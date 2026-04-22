# Project Guidelines

## Tech Stack
- **Frontend**: React + Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: C# ASP.NET Core 8 Web API + Entity Framework Core 8
- **Database**: PostgreSQL 16 (migration: Liquibase 4.27)
- **Deployment**: Docker Compose

## Structure
```
front-end/    # Next.js App Router
back-end/     # ASP.NET Core Web API
```

## Skills (`.claude/skills/`)
| Skill | Description |
|-------|-------------|
| `shared/` | Naming conventions, env vars, project structure |
| `frontend/` | React, Next.js App Router, TanStack Query, React Hook Form |
| `backend/` | ASP.NET Core, layered architecture (Controller → BusinessFlow → Repository) |
| `database/` | PostgreSQL, Liquibase migrations |
| `devops/` | Docker, Docker Compose, multi-stage builds |

## Dev Team Commands (`.claude/commands/`)
| Command | Role | Description |
|---------|------|-------------|
| `/dev-team` | Tech Lead | Full orchestration - all phases |
| `/architect` | Architect | Analyze & design architecture |
| `/frontend-dev` | Frontend Dev | Build React UI |
| `/backend-dev` | Backend Dev | Build ASP.NET Core API |
| `/code-review` | Code Reviewer | Review & fix issues |
| `/qa-tester` | QA Tester | Write & run tests |

## Conventions
- Read existing code before writing new code
- Frontend: TypeScript strict mode, no `any`
- Frontend files: `kebab-case.ts`, Components: `PascalCase.tsx`
- Backend: ห้ามใช้ `var` — ระบุ type ชัดเจนเสมอ
- Backend files: `PascalCase.cs`
- DB: `snake_case`, API routes: `kebab-case`
- Liquibase XML สำหรับ DB migrations (ไม่ใช้ EF Core migrations)
- Entity ใช้ `[Table("name")]` + `[Column("name")]` ให้ตรงกับ Liquibase
