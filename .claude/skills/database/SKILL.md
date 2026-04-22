---
name: database
description: "Database knowledge base for PostgreSQL with Node.js pg driver. Use when designing schemas, writing migrations, building query models, or debugging database issues in back-end/src/db/. Covers connection pooling, migration patterns, parameterized queries, transactions, indexing, and data types."
---

# Database Knowledge - PostgreSQL + TypeScript

You are an expert database engineer with deep knowledge of PostgreSQL and the Node.js `pg` driver. Your role is to design efficient schemas and write safe, performant queries.

---

## TABLE OF CONTENTS
1. Connection Pool
2. Migration Pattern
3. Model Pattern
4. Transactions
5. Schema Design Rules
6. Indexing Strategy
7. Best Practices & Anti-Patterns
8. Quick Reference

---

## 1. Connection Pool

```ts
// back-end/src/db/index.ts
import { Pool, QueryResultRow } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
```

## 2. Migration Pattern

```
back-end/src/db/migrations/
├── 001_create-users.sql
├── 002_create-posts.sql
├── 003_add-user-avatar.sql
└── ...
```

### Migration File Format
```sql
-- 001_create-users.sql
-- Up
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Down
-- DROP TABLE IF EXISTS users;
```

### Migration Runner
```ts
// back-end/src/db/migrate.ts
import fs from 'fs';
import path from 'path';
import { pool } from './index';

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM migrations WHERE name = $1', [file]);
    if (rows.length) continue;

    const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
    await pool.query(sql);
    await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
    console.log(`Migration applied: ${file}`);
  }
}
```

## 3. Model Pattern

```ts
// models/user.model.ts
import { query, queryOne } from '../db';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export const UserModel = {
  findAll: () =>
    query<UserRow>('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC'),

  findById: (id: string) =>
    queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]),

  findByEmail: (email: string) =>
    queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email]),

  create: (email: string, passwordHash: string, name: string) =>
    queryOne<UserRow>(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, passwordHash, name]
    ),

  update: (id: string, fields: Partial<Pick<UserRow, 'name' | 'email'>>) => {
    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (fields.name)  { sets.push(`name = $${i++}`);  values.push(fields.name); }
    if (fields.email) { sets.push(`email = $${i++}`);  values.push(fields.email); }
    sets.push(`updated_at = NOW()`);
    values.push(id);

    return queryOne<UserRow>(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
  },

  delete: (id: string) =>
    query('DELETE FROM users WHERE id = $1', [id]),
};
```

## 4. Transactions

```ts
import { pool } from '../db';

export async function transferCredits(fromId: string, toId: string, amount: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [amount, fromId]);
    await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [amount, toId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

## 5. Schema Design Rules

| Rule | Example |
|------|---------|
| UUID primary keys | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Always add timestamps | `created_at TIMESTAMPTZ DEFAULT NOW()` |
| Use TIMESTAMPTZ | Never use `TIMESTAMP` without timezone |
| Foreign keys with ON DELETE | `REFERENCES users(id) ON DELETE CASCADE` |
| NOT NULL by default | Only allow NULL when business logic requires it |
| VARCHAR with limits | `VARCHAR(255)` not `TEXT` for bounded fields |

## 6. Indexing Strategy

```sql
-- Always index: foreign keys, unique constraints, frequently filtered columns
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Composite index for common query patterns
CREATE INDEX idx_posts_user_status ON posts(user_id, status);
```

## 7. Best Practices & Anti-Patterns

### DO
- Always use parameterized queries (`$1, $2`)
- Use transactions for multi-table writes
- Add indexes for foreign keys and filtered columns
- Use `RETURNING *` to get inserted/updated rows
- Use `gen_random_uuid()` for UUIDs (built-in PostgreSQL 13+)

### DON'T
- Never use string concatenation in SQL
- Never modify migration files after deployment
- Don't SELECT * in list queries (select only needed columns)
- Don't forget to release pool clients in transactions
- Don't use `SERIAL` for PKs (use UUID)

## 8. Quick Reference

| Task | SQL Pattern |
|------|-------------|
| Create table | `CREATE TABLE IF NOT EXISTS ... (id UUID PRIMARY KEY DEFAULT gen_random_uuid())` |
| Insert | `INSERT INTO t (col) VALUES ($1) RETURNING *` |
| Update | `UPDATE t SET col = $1, updated_at = NOW() WHERE id = $2 RETURNING *` |
| Soft delete | Add `deleted_at TIMESTAMPTZ` column, filter with `WHERE deleted_at IS NULL` |
| Pagination | `LIMIT $1 OFFSET $2` or cursor-based with `WHERE id > $1 LIMIT $2` |
| Count | `SELECT COUNT(*) FROM t WHERE condition` |
| Exists check | `SELECT EXISTS(SELECT 1 FROM t WHERE condition)` |
