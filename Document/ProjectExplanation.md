# Person Management System - อธิบาย Project สำหรับสัมภาษณ์งาน

## ภาพรวม (Overview)

ระบบจัดการข้อมูลบุคคล (Person Management System) เป็น **Full-Stack Web Application** ที่ใช้สถาปัตยกรรมแบบ **Monorepo** โดยแยก Frontend และ Backend เป็น project คนละตัว สื่อสารกันผ่าน REST API และ deploy ทั้งระบบด้วย **Docker Compose**

```
┌─────────────┐      HTTP/REST       ┌──────────────┐      EF Core       ┌──────────────┐
│   Frontend   │  ──────────────────► │   Backend    │  ────────────────► │  PostgreSQL  │
│  Next.js 14  │    JSON over HTTP    │ ASP.NET Core │    Npgsql Driver   │     16       │
│  Port 3001   │  ◄────────────────── │   Port 5000  │  ◄──────────────── │  Port 5850   │
└─────────────┘      JSON Response    └──────────────┘      SQL Query     └──────────────┘
                                                                                ▲
                                                                                │ Liquibase
                                                                                │ Migration
                                                                          ┌─────┴────────┐
                                                                          │   Liquibase   │
                                                                          │    4.27       │
                                                                          └──────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Next.js (App Router) + TypeScript + Tailwind CSS | Next.js 14.2 |
| Backend | C# ASP.NET Core Web API + Entity Framework Core | .NET 8 / EF Core 8 |
| Database | PostgreSQL | 16 |
| DB Migration | Liquibase (XML format) | 4.27 |
| Deployment | Docker + Docker Compose | - |

---

## ฟีเจอร์หลัก (Features)

1. **ดูรายการบุคคลทั้งหมด** - แสดงตาราง ชื่อ-นามสกุล, ที่อยู่, วันเกิด, อายุ
2. **เพิ่มข้อมูลบุคคล** - ฟอร์มกรอกข้อมูล พร้อม validation ทั้ง client-side และ server-side
3. **ดูรายละเอียดบุคคล** - Modal แสดงข้อมูลเต็ม

---

## Frontend (หน้าบ้าน)

### โครงสร้าง Directory

```
front-end/
├── src/app/
│   ├── layout.tsx          # Root layout (TanStack Query Provider)
│   ├── page.tsx            # หน้าหลัก - แสดง PersonTable
│   ├── providers.tsx       # QueryClientProvider wrapper
│   └── globals.css         # Tailwind CSS base styles
├── components/
│   ├── persons/
│   │   ├── PersonTable.tsx     # ตารางแสดงรายการบุคคล
│   │   ├── AddPersonModal.tsx  # Modal ฟอร์มเพิ่มข้อมูล
│   │   └── ViewPersonModal.tsx # Modal แสดงรายละเอียด
│   └── ui/
│       ├── Modal.tsx           # Reusable Modal component
│       ├── DatePicker.tsx      # Date picker component
│       └── Toast.tsx           # Notification toast
├── hooks/
│   └── use-persons.ts     # Custom hooks (usePersons, useCreatePerson)
├── services/
│   ├── api.ts              # HTTP client (fetchJson wrapper)
│   └── person-service.ts   # API functions (getPersons, createPerson)
├── types/
│   └── person.ts           # TypeScript type definitions
├── Dockerfile              # Multi-stage Docker build
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### เทคโนโลยีหลัก & ทำไมถึงเลือกใช้

| Library | ใช้ทำอะไร | ทำไมถึงเลือก |
|---------|----------|-------------|
| **Next.js 14 (App Router)** | Framework หลัก | มี SSR/SSG, file-based routing, image optimization ในตัว |
| **TanStack Query (React Query)** | จัดการ server state (data fetching, caching) | auto-refetch, cache invalidation, loading/error state ให้ฟรี ไม่ต้องเขียน useEffect + useState เอง |
| **React Hook Form + Zod** | จัดการฟอร์ม + validation | performance ดี (uncontrolled components), Zod ให้ type-safe schema validation |
| **Tailwind CSS** | Styling | Utility-first, ไม่ต้อง switch ไฟล์ CSS, สร้าง responsive UI ได้เร็ว |
| **date-fns** | จัดการวันที่ | Tree-shakable, lightweight กว่า moment.js |

### Data Flow (Frontend)

```
User กดปุ่ม "เพิ่มข้อมูล"
    │
    ▼
AddPersonModal เปิดขึ้น
    │
    ▼
User กรอกฟอร์ม → React Hook Form จัดการ state
    │
    ▼
User กด "บันทึก"
    │
    ▼
Zod Schema Validation (client-side)
    │  ✗ Error → แสดง error message ใต้ field
    ▼  ✓ Pass
useCreatePerson() hook → เรียก createPerson() service
    │
    ▼
fetchJson() → POST http://localhost:5000/api/persons
    │
    ▼  ✓ สำเร็จ
invalidateQueries(['persons']) → TanStack Query refetch ข้อมูลใหม่อัตโนมัติ
    │
    ▼
PersonTable แสดงข้อมูลที่เพิ่มมาใหม่ทันที
```

### State Management Strategy

Project นี้ **ไม่ใช้ Global State** (ไม่มี Redux/Zustand) เพราะ:
- **Server State** → ใช้ TanStack Query จัดการ (data fetching, caching, refetching)
- **UI State** → ใช้ `useState` ภายใน component (เช่น modal open/close)
- **Form State** → ใช้ React Hook Form จัดการ

> หลักการ: ถ้าข้อมูลมาจาก server ให้ TanStack Query จัดการ ไม่ต้อง sync ลง global store

### Validation Strategy (2 ชั้น)

| ชั้น | เครื่องมือ | ตัวอย่าง |
|------|----------|---------|
| **Client-side** | Zod + React Hook Form | `postalCode: z.string().length(5).regex(/^\d{5}$/)` |
| **Server-side** | Data Annotations (C#) | `[StringLength(5, MinimumLength = 5)]`, `[RegularExpression(@"^\d{5}$")]` |

---

## Backend (หลังบ้าน)

### โครงสร้าง Directory

```
back-end/
├── PersonApi/
│   ├── Controllers/
│   │   ├── PersonsController.cs  # REST API endpoints
│   │   └── HealthController.cs   # Health check endpoint
│   ├── BusinessFlow/
│   │   ├── IPersonBusiness.cs    # Interface
│   │   └── PersonBusiness.cs     # Business logic + mapping
│   ├── Repositories/
│   │   ├── IPersonRepository.cs  # Interface
│   │   └── PersonRepository.cs   # Database access (EF Core)
│   ├── Models/
│   │   ├── PersonEntity.cs       # Entity (map กับ DB table)
│   │   └── PersonDto.cs          # Request/Response DTOs
│   ├── Data/
│   │   └── AppDbContext.cs       # EF Core DbContext
│   ├── Exceptions/
│   │   ├── AppException.cs       # Custom exception hierarchy
│   │   └── ErrorResponse.cs      # Error response model
│   ├── Converters/
│   │   └── DateOnlyJsonConverter.cs  # DateOnly ↔ JSON
│   ├── Liquibase/
│   │   └── changelog/
│   │       ├── db.changelog-master.xml
│   │       └── migrations/
│   │           └── 001_create_persons_table.xml
│   ├── Program.cs                # Application entry point + DI setup
│   └── PersonApi.csproj
├── PersonApi.Test/
│   ├── PersonBusinessTests.cs    # Unit tests
│   └── PersonApi.Test.csproj
├── ProjectTest.sln
└── Dockerfile                    # Multi-stage Docker build
```

### Layered Architecture (สถาปัตยกรรมแบบแบ่งชั้น)

```
┌───────────────────────────────────────────────────────────┐
│                    HTTP Request (JSON)                     │
└───────────────────────┬───────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────────┐
│  Controller Layer     │  PersonsController.cs              │
│  หน้าที่: รับ request, ส่ง response                         │
│  ไม่มี business logic                                      │
└───────────────────────┬───────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────────┐
│  Business Layer       │  PersonBusiness.cs                  │
│  หน้าที่: business logic, validation, mapping              │
│  แปลง Entity ↔ DTO                                        │
└───────────────────────┬───────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────────┐
│  Repository Layer     │  PersonRepository.cs                │
│  หน้าที่: CRUD กับ database ผ่าน EF Core                    │
│  ไม่รู้เรื่อง business rule                                  │
└───────────────────────┬───────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────────┐
│  Database             │  PostgreSQL (via EF Core + Npgsql) │
└───────────────────────────────────────────────────────────┘
```

> **ทำไมถึงแยกชั้น?** → แต่ละชั้นมีหน้าที่เดียว (Single Responsibility) เปลี่ยน database ได้โดยไม่กระทบ business logic, test business logic ได้โดยไม่ต้องมี database จริง (mock repository)

### Dependency Injection (DI)

ใน `Program.cs` จะ register services ทั้งหมดเข้า DI Container:

```csharp
// Repository
builder.Services.AddScoped<IPersonRepository, PersonRepository>();

// BusinessFlow
builder.Services.AddScoped<IPersonBusiness, PersonBusiness>();
```

- ใช้ **Interface** (`IPersonRepository`, `IPersonBusiness`) เพื่อลด coupling
- `AddScoped` = สร้าง instance ใหม่ทุก HTTP request (เหมาะกับ DbContext)
- Constructor Injection ผ่าน **Primary Constructor** syntax ของ C# 12:
  ```csharp
  public class PersonBusiness(IPersonRepository repo) : IPersonBusiness
  ```

### API Endpoints

| Method | URL | Description | Request Body | Response |
|--------|-----|-------------|-------------|----------|
| `GET` | `/api/persons` | ดึงรายการทั้งหมด | - | `PersonResponse[]` |
| `GET` | `/api/persons/{id}` | ดึงตาม ID | - | `PersonResponse` |
| `POST` | `/api/persons` | เพิ่มข้อมูลใหม่ | `CreatePersonRequest` | `PersonResponse` |

### Request/Response Flow (ตัวอย่าง POST สร้างบุคคลใหม่)

```
1. Client ส่ง POST /api/persons พร้อม JSON body
   │
2. ASP.NET Core Model Binding แปลง JSON → CreatePersonRequest object
   │  + Data Annotations Validation ([Required], [MaxLength], [RegularExpression])
   │  ✗ Fail → 400 Bad Request อัตโนมัติ
   ▼
3. PersonsController.Create() รับ request
   │  เรียก business.Create(request)
   ▼
4. PersonBusiness.Create()
   │  - สร้าง PersonEntity จาก request (manual mapping)
   │  - set CreatedAt = DateTime.UtcNow
   │  - เรียก repo.Add(entity)
   ▼
5. PersonRepository.Add()
   │  - db.Persons.Add(entity)    ← EF Core track entity
   │  - db.SaveChanges()          ← สร้าง SQL INSERT, ส่งไป PostgreSQL
   │  - PostgreSQL auto-generate Id (SERIAL)
   ▼
6. PersonBusiness.MapToResponse()
   │  แปลง Entity → PersonResponse DTO (ไม่ส่ง internal fields ออก)
   ▼
7. Controller return PersonResponse
   │  ASP.NET Core แปลงเป็น JSON + ส่ง 200 OK
   ▼
8. Client ได้รับ JSON response
```

### Exception Handling (Global)

ใช้ **Global Exception Handler** ใน `Program.cs` แทนการ try-catch ในทุก controller:

```csharp
// Custom Exception Hierarchy
AppException (abstract)
├── NotFoundException      → 404
├── ValidationException    → 400
├── ConflictException      → 409
├── UnauthorizedException  → 401
└── ForbiddenException     → 403
```

เมื่อ Business Layer throw `NotFoundException` → middleware จับได้ → ส่ง JSON error response:
```json
{ "errorCode": "404", "message": "Person with id 99 not found" }
```

> ข้อดี: Controller ไม่ต้อง try-catch, โค้ดสะอาด, error format เป็นมาตรฐานเดียวกันทั้ง API

---

## Database

### Schema (ตาราง persons)

```sql
CREATE TABLE persons (
    id           SERIAL PRIMARY KEY,
    first_name   VARCHAR(100)  NOT NULL,
    last_name    VARCHAR(100)  NOT NULL,
    house_number VARCHAR(20)   NOT NULL,
    street       VARCHAR(200),            -- nullable
    sub_district VARCHAR(100)  NOT NULL,
    district     VARCHAR(100)  NOT NULL,
    province     VARCHAR(100)  NOT NULL,
    postal_code  CHAR(5)       NOT NULL,
    birth_date   DATE          NOT NULL,
    created_at   TIMESTAMPTZ   DEFAULT NOW()
);
```

### ทำไมใช้ Liquibase แทน EF Core Migrations?

| | EF Core Migrations | Liquibase |
|---|---|---|
| **ภาษา** | C# | XML/YAML/SQL |
| **ข้อดี** | ง่ายสำหรับ .NET dev | Database-agnostic, ใช้ได้กับทุกภาษา |
| **เหมาะกับ** | Project เล็ก, ทีม .NET ล้วน | ทีมใหญ่, มี DBA, multi-platform |
| **Rollback** | ต้องเขียนเอง | มี rollback ในตัว |

> ในโปรเจกต์นี้เลือก Liquibase เพราะ: แยก migration ออกจากโค้ด backend ได้ชัดเจน, DBA สามารถ review SQL ได้ง่าย, และ run เป็น Docker container แยกต่างหาก

### Naming Convention

| Layer | Convention | ตัวอย่าง |
|-------|-----------|---------|
| Database (table/column) | `snake_case` | `first_name`, `postal_code` |
| C# Entity (property) | `PascalCase` | `FirstName`, `PostalCode` |
| API JSON (field) | `camelCase` | `firstName`, `postalCode` |
| TypeScript (property) | `camelCase` | `firstName`, `postalCode` |

EF Core + `UseSnakeCaseNamingConvention()` + `[Column("...")]` attribute จัดการ mapping ระหว่าง PascalCase ↔ snake_case อัตโนมัติ

---

## Docker & Deployment

### วิธี Build & Run ทั้งระบบ (คำสั่งเดียว)

```bash
docker compose up --build
```

### ลำดับการ Start (Orchestration)

```
Step 1: db (PostgreSQL)
   │  healthcheck: pg_isready ทุก 10 วินาที
   │  ✓ healthy
   ▼
Step 2: migrate (Liquibase)
   │  depends_on: db (service_healthy)
   │  รัน changelog → สร้างตาราง persons
   │  ✓ service_completed_successfully (exit 0)
   ▼
Step 3: backend (ASP.NET Core)
   │  depends_on: db (healthy) + migrate (completed)
   │  เชื่อมต่อ PostgreSQL ผ่าน connection string
   ▼
Step 4: frontend (Next.js)
   │  depends_on: backend
   │  เชื่อมต่อ API ผ่าน NEXT_PUBLIC_API_URL
   ▼
ระบบพร้อมใช้งาน!
```

### Docker Multi-Stage Build

**Backend (Dockerfile)**
```
Stage 1: "build"  → ใช้ SDK image (ใหญ่ ~700MB) เพื่อ restore + publish
Stage 2: "runner" → ใช้ ASP.NET runtime image (เล็ก ~200MB) เพื่อ run
```

**Frontend (Dockerfile)**
```
Stage 1: "deps"   → npm ci (install dependencies)
Stage 2: "build"  → copy node_modules + source → npm run build
Stage 3: "runner" → copy standalone output เท่านั้น (เล็กมาก)
                    + ใช้ non-root user (nextjs:nodejs) เพื่อความปลอดภัย
```

> **ทำไมใช้ Multi-Stage?** → Image สุดท้ายมีแค่ไฟล์ที่จำเป็น ขนาดเล็กลง 60-80%, ไม่มี source code หรือ dev dependencies ใน production image

### Port Mapping

| Service | Container Port | Host Port | URL |
|---------|---------------|-----------|-----|
| PostgreSQL | 5432 | 5850 | `localhost:5850` |
| Backend API | 5000 | 5000 | `http://localhost:5000` |
| Frontend | 3000 | 3001 | `http://localhost:3001` |

---

## สรุป Design Decisions ที่น่าสนใจ (สำหรับตอบสัมภาษณ์)

### 1. ทำไมแยก Frontend/Backend เป็น project คนละตัว?
- **Scale แยกกันได้** → Frontend traffic สูง ก็เพิ่ม container frontend อย่างเดียว
- **Deploy แยกกันได้** → แก้ bug frontend ไม่ต้อง redeploy backend
- **ทีมทำงานแยกได้** → Frontend dev ไม่ต้องรู้ C#, Backend dev ไม่ต้องรู้ React

### 2. ทำไมใช้ TanStack Query แทน useEffect + fetch?
- **Caching** → ไม่ต้อง fetch ซ้ำถ้าข้อมูลยังอยู่ใน cache
- **Auto Refetch** → เมื่อ user กลับมาที่ tab, data จะ fresh อัตโนมัติ
- **Cache Invalidation** → สร้าง person ใหม่แล้ว `invalidateQueries(['persons'])` ตารางอัพเดตทันที
- **Loading/Error state** → ไม่ต้องเขียน useState สำหรับ isLoading, isError เอง

### 3. ทำไมใช้ Interface + DI?
- **Testable** → Unit test ใส่ mock repository เข้าไปแทนของจริงได้
- **Loose Coupling** → เปลี่ยน PostgreSQL เป็น MySQL แค่สร้าง Repository ใหม่ ไม่ต้องแก้ Business Layer
- **SOLID Principle** → Dependency Inversion Principle (depend on abstraction, not concretion)

### 4. ทำไมไม่ใช้ var ใน C#?
- **Readability** → อ่านโค้ดแล้วรู้ type ทันที ไม่ต้อง hover ดู
- **Code Review ง่าย** → reviewer เห็น type ชัดเจนใน diff
- เป็น convention ของทีม ที่กำหนดไว้ใน project guidelines

### 5. ทำไมแยก Entity กับ DTO?
- **Security** → ไม่ expose internal field (เช่น password hash) ไปหา client
- **Flexibility** → Response shape ไม่จำเป็นต้องเหมือน DB schema
- **Versioning** → เปลี่ยน API response ได้โดยไม่กระทบ database

### 6. ทำไมใช้ Docker Compose?
- **One command** → `docker compose up --build` ได้ทั้งระบบ
- **Environment parity** → Dev กับ Production ใช้ config เดียวกัน
- **Dependency ordering** → db → migrate → backend → frontend start ตามลำดับ
- **Isolation** → แต่ละ service อยู่ใน container ของตัวเอง ไม่ conflict กัน
