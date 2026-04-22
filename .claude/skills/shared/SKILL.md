---
name: shared
description: "Shared project conventions and standards for the entire monorepo. Use when writing any code - TypeScript strict mode, naming conventions, environment variables, project structure. Applies to both front-end/ and back-end/ directories."
---

# Shared Project Conventions

You are an expert TypeScript developer working on a monorepo with React (Next.js) frontend and Node.js (Express) backend.

---

## TABLE OF CONTENTS
1. Tech Stack
2. Project Structure
3. TypeScript Standards
4. Naming Conventions
5. Environment Variables
6. Error Handling Philosophy
7. Git Conventions

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Frontend | React 18+ / Next.js 14+ (App Router) |
| Backend | Node.js / Express |
| Database | PostgreSQL 16 |
| Deployment | Docker Compose |
| Package Manager | npm |

## 2. Project Structure

```
front-end/          # Next.js app
back-end/           # Express API
docker-compose.yml  # Orchestration
tasks/              # Task tracking & lessons
  ├── todo.md
  └── lessons.md
```

## 3. TypeScript Standards

- `strict: true` in all tsconfig files
- No `any` — use `unknown` if type is uncertain
- Prefer `interface` over `type` for object shapes
- Use union types over `enum` unless values are fixed and known
- Use absolute imports with path aliases (`@/` prefix)
- Export types explicitly: `export type { User }`

### Decision Tree: Type Definition
```
Need a type?
├── Object shape → interface
├── Union of values → type alias with union ("a" | "b")
├── Fixed constant set → const enum (rare)
└── Function signature → type alias
```

## 4. Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files (TS) | `kebab-case.ts` | `user-service.ts` |
| Components | `PascalCase.tsx` | `UserProfile.tsx` |
| Variables/Functions | `camelCase` | `getUserById` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| DB Tables/Columns | `snake_case` | `user_profiles.created_at` |
| API Routes | `kebab-case` | `/api/user-profiles` |
| Env Variables | `UPPER_SNAKE_CASE` | `DB_HOST` |
| Types/Interfaces | `PascalCase` | `UserProfile` |

## 5. Environment Variables

- Use `.env` files (never commit to git)
- Prefix by context: `DB_`, `API_`, `JWT_`, `NEXT_PUBLIC_`
- Always validate at startup with Zod schema
- Frontend (client-side): must use `NEXT_PUBLIC_` prefix
- Backend: no prefix needed

```ts
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  JWT_SECRET: z.string().min(32),
  API_PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
```

## 6. Error Handling Philosophy

- Validate at system boundaries (user input, external APIs)
- Trust internal code and framework guarantees
- Don't add error handling for impossible scenarios
- Use typed errors, not generic strings

## 7. Git Conventions

- Commit messages: `type: short description` (feat, fix, refactor, test, docs)
- One feature per branch
- PR must pass build + tests before merge
