---
name: frontend
description: "Frontend knowledge base for React + Next.js 14+ App Router with TypeScript. Use when designing, implementing, or debugging frontend code in front-end/ directory. Covers component patterns, Server/Client Components, routing, state management (TanStack Query, Zustand), forms (React Hook Form + Zod), API integration, and styling."
---

# Frontend Knowledge - React + Next.js + TypeScript

You are an expert frontend developer with deep knowledge of React, Next.js App Router, and TypeScript. Your role is to build accessible, performant, and well-structured UI code.

---

## TABLE OF CONTENTS
1. Project Structure
2. App Router Conventions
3. Server vs Client Components
4. Component Patterns
5. State Management
6. API Integration
7. Forms & Validation
8. Styling
9. Best Practices & Anti-Patterns
10. Quick Reference

---

## 1. Project Structure

```
front-end/
├── src/
│   └── app/                    # App Router
│       ├── layout.tsx          # Root layout
│       ├── page.tsx            # Home page (/)
│       ├── loading.tsx         # Global loading
│       ├── error.tsx           # Global error boundary
│       ├── not-found.tsx       # 404 page
│       ├── (auth)/             # Route group (no URL segment)
│       │   ├── login/page.tsx
│       │   └── register/page.tsx
│       └── dashboard/
│           ├── layout.tsx      # Nested layout
│           ├── page.tsx
│           └── [id]/page.tsx   # Dynamic route
├── components/
│   ├── ui/                     # Base components (Button, Input, Modal, Card)
│   └── [feature]/              # Feature-specific components
├── hooks/                      # Custom React hooks
├── services/                   # API call functions
├── stores/                     # Zustand stores
├── types/                      # Shared TypeScript types
├── utils/                      # Pure helper functions
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 2. App Router Conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Route page (required for route to exist) |
| `layout.tsx` | Shared layout wrapping children |
| `loading.tsx` | Loading UI (automatic Suspense boundary) |
| `error.tsx` | Error boundary (must be `'use client'`) |
| `not-found.tsx` | 404 page |
| `route.ts` | API route handler (if needed for BFF) |

### Routing Patterns
```
src/app/page.tsx              → /
src/app/about/page.tsx        → /about
src/app/blog/[slug]/page.tsx  → /blog/:slug
src/app/(auth)/login/page.tsx → /login  (group doesn't affect URL)
```

## 3. Server vs Client Components

### Decision Tree
```
Need interactivity? (onClick, onChange, hooks)
├── YES → 'use client'
│   ├── Uses browser APIs? (localStorage, window) → 'use client'
│   ├── Manages form state? → 'use client'
│   └── Uses React hooks? (useState, useEffect) → 'use client'
└── NO → Server Component (default)
    ├── Fetches data? → Server Component (async)
    ├── Accesses backend directly? → Server Component
    └── Static display? → Server Component
```

### Server Component (default)
```tsx
// app/users/page.tsx — NO 'use client' directive
import { fetchUsers } from '@/services/user-service';

export default async function UsersPage() {
  const users = await fetchUsers();
  return (
    <main>
      <h1>Users</h1>
      <UserList users={users} />
    </main>
  );
}
```

### Client Component
```tsx
// components/search-bar.tsx
'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
    </form>
  );
}
```

## 4. Component Patterns

### Base Component
```tsx
// components/ui/Button.tsx
'use client';

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

## 5. State Management

### Server State → TanStack Query
```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser } from '@/services/user-service';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
```

### Client State → Zustand (only when needed)
```tsx
// stores/ui-store.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

## 6. API Integration

```tsx
// services/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

// services/user-service.ts
import { fetchJson } from './api';
import type { User, CreateUserInput } from '@/types/user';

export const fetchUsers = () => fetchJson<User[]>('/users');
export const fetchUser = (id: string) => fetchJson<User>(`/users/${id}`);
export const createUser = (data: CreateUserInput) =>
  fetchJson<User>('/users', { method: 'POST', body: JSON.stringify(data) });
```

## 7. Forms & Validation

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm({ onSubmit }: { onSubmit: (data: LoginForm) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} type="email" aria-label="Email" />
      {errors.email && <span role="alert">{errors.email.message}</span>}

      <input {...register('password')} type="password" aria-label="Password" />
      {errors.password && <span role="alert">{errors.password.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## 8. Styling

Use Tailwind CSS as primary styling approach:
- Utility-first, compose in component
- Extract repeated patterns to component, not CSS
- Use `cn()` helper for conditional classes

## 9. Best Practices & Anti-Patterns

### DO
- Keep Server Components as default
- Co-locate components with their routes when page-specific
- Use `loading.tsx` and `error.tsx` per route segment
- Type all props with interfaces
- Use `next/image` and `next/link`

### DON'T
- Don't use `useEffect` for data fetching (use TanStack Query or Server Components)
- Don't put `'use client'` on every component
- Don't use Pages Router patterns (`getServerSideProps`, etc.)
- Don't store server state in Zustand (use TanStack Query)
- Don't use `any` types

## 10. Quick Reference

| Task | Solution |
|------|----------|
| Fetch data on page load | Server Component with `async/await` |
| Fetch data with caching/refetch | TanStack Query in Client Component |
| Global UI state | Zustand store |
| Form handling | React Hook Form + Zod |
| Navigation | `next/link` + `useRouter()` |
| Images | `next/image` with width/height |
| Env vars (client) | `NEXT_PUBLIC_` prefix |
| Styling | Tailwind CSS utility classes |
