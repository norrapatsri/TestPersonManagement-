---
name: devops
description: "DevOps knowledge base for Docker and Docker Compose deployment. Use when creating Dockerfiles, docker-compose.yml, configuring containers, environment variables, health checks, or debugging deployment issues. Covers multi-stage builds, Next.js standalone output, Node.js production images, PostgreSQL containers, and nginx configuration."
---

# DevOps Knowledge - Docker Compose Deployment

You are an expert DevOps engineer with deep knowledge of Docker and container orchestration. Your role is to build efficient, secure, and reliable deployment configurations.

---

## TABLE OF CONTENTS
1. Docker Compose
2. Frontend Dockerfile (Next.js)
3. Backend Dockerfile (Node.js)
4. Dockerignore
5. Environment Configuration
6. Health Checks
7. Common Commands
8. Best Practices & Anti-Patterns
9. Quick Reference

---

## 1. Docker Compose

```yaml
# docker-compose.yml
services:
  frontend:
    build:
      context: ./front-end
      dockerfile: Dockerfile
    ports:
      - "${FRONTEND_PORT:-3001}:3000"
    depends_on:
      - backend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:${API_PORT:-3000}/api
    restart: unless-stopped

  backend:
    build:
      context: ./back-end
      dockerfile: Dockerfile
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=${DB_NAME:-appdb}
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    ports:
      - "${DB_PORT:-5432}:5432"
    environment:
      - POSTGRES_DB=${DB_NAME:-appdb}
      - POSTGRES_USER=${DB_USER:-postgres}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
```

## 2. Frontend Dockerfile (Next.js Standalone)

```dockerfile
# front-end/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**Required** in `next.config.ts`:
```ts
const nextConfig = {
  output: 'standalone',
};
export default nextConfig;
```

## 3. Backend Dockerfile (Node.js)

```dockerfile
# back-end/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

USER expressjs
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 4. Dockerignore

```
# front-end/.dockerignore AND back-end/.dockerignore
node_modules
.next
dist
.env
.env.*
.git
*.md
.vscode
```

## 5. Environment Configuration

```env
# .env (root - for docker compose)
# Database
DB_NAME=appdb
DB_USER=postgres
DB_PASSWORD=changeme_in_production
DB_PORT=5432

# Backend
API_PORT=3000
JWT_SECRET=changeme_minimum_32_characters_long

# Frontend
FRONTEND_PORT=3001
```

## 6. Health Checks

```yaml
# Backend health check (add to docker-compose.yml)
backend:
  healthcheck:
    test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1))"]
    interval: 10s
    timeout: 5s
    retries: 3
```

```ts
// back-end/src/routes/health.routes.ts
import { Router } from 'express';
const router = Router();
router.get('/health', (req, res) => res.json({ status: 'ok' }));
export default router;
```

## 7. Common Commands

```bash
# Build and start all services
docker compose up --build

# Start in background
docker compose up -d

# View logs
docker compose logs -f backend

# Stop all
docker compose down

# Reset database (destroy volume)
docker compose down -v

# Rebuild single service
docker compose build backend
docker compose up -d backend
```

## 8. Best Practices & Anti-Patterns

### DO
- Use multi-stage builds to minimize image size
- Run as non-root user in production
- Use `npm ci` instead of `npm install`
- Pin base image versions (`node:20-alpine`, not `node:latest`)
- Use health checks for service readiness
- Use volumes for persistent data (database)
- Use `.dockerignore` to exclude unnecessary files

### DON'T
- Never put secrets in Dockerfiles
- Never commit `.env` files to git
- Don't use `latest` tag for base images
- Don't run containers as root
- Don't copy `node_modules` into the image (install inside)

## 9. Quick Reference

| Task | Command |
|------|---------|
| Start all | `docker compose up --build` |
| Start detached | `docker compose up -d` |
| Stop all | `docker compose down` |
| Reset DB | `docker compose down -v` |
| View logs | `docker compose logs -f [service]` |
| Shell into container | `docker compose exec backend sh` |
| Connect to DB | `docker compose exec db psql -U postgres -d appdb` |
