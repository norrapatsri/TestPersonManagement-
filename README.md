# Person Management System (ระบบจัดการข้อมูลบุคคล)

ระบบจัดการข้อมูลบุคคล (CRUD) พัฒนาด้วย **Next.js + C# ASP.NET Core 8 + PostgreSQL** รันผ่าน **Docker Compose**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod |
| Backend | C# ASP.NET Core 8 Web API, Entity Framework Core 8, Npgsql |
| Database | PostgreSQL 16 |
| Migration | Liquibase 4.27 |
| Deployment | Docker, Docker Compose |

## Project Structure

```
TestPersonManagement-/
├── front-end/                   # Next.js frontend
│   ├── src/app/                 # App Router (layout, page, providers)
│   ├── components/
│   │   ├── persons/             # PersonTable, AddPersonModal, ViewPersonModal
│   │   └── ui/                  # DatePicker, Modal, Toast
│   ├── services/                # API client & person service
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript types
│   └── Dockerfile
├── back-end/
│   ├── PersonApi/               # ASP.NET Core Web API
│   │   ├── Controllers/         # PersonsController, HealthController
│   │   ├── BusinessFlow/        # Business logic layer
│   │   ├── Repositories/        # Data access layer
│   │   ├── Models/              # Entity & DTO classes
│   │   ├── Converters/          # JSON converters
│   │   ├── Exceptions/          # Custom exceptions & error response
│   │   ├── Data/                # EF Core DbContext
│   │   └── Liquibase/changelog/ # Database migration scripts
│   ├── PersonApi.Test/          # Unit tests
│   └── Dockerfile
├── Document/                    # Project documents
│   ├── Solution/
│   ├── Tasks/
│   └── TestPlan/
├── docker-compose.yml           # Production
├── docker-compose.dev.yml       # Development
└── .env.example                 # Environment variables template
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/persons` | ดึงรายชื่อบุคคลทั้งหมด |
| GET | `/api/persons/{id}` | ดึงข้อมูลบุคคลตาม ID |
| POST | `/api/persons` | เพิ่มข้อมูลบุคคลใหม่ |
| GET | `/health` | Health check |

## Data Model (persons)

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL (PK) | รหัสบุคคล |
| first_name | VARCHAR(100) | ชื่อ |
| last_name | VARCHAR(100) | นามสกุล |
| house_number | VARCHAR(20) | บ้านเลขที่ |
| street | VARCHAR(200) | ถนน (optional) |
| sub_district | VARCHAR(100) | ตำบล/แขวง |
| district | VARCHAR(100) | อำเภอ/เขต |
| province | VARCHAR(100) | จังหวัด |
| postal_code | CHAR(5) | รหัสไปรษณีย์ |
| birth_date | DATE | วันเกิด |
| created_at | TIMESTAMPTZ | วันที่สร้าง |

---

## วิธีรัน (How to Run)

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose

### 1. Clone & Setup Environment

```bash
git clone <repository-url>
cd TestPersonManagement-

# สร้างไฟล์ .env จาก template
cp .env.example .env
```

ค่า default ใน `.env`:

```env
DB_NAME=personsdb
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
API_PORT=5000
FRONTEND_PORT=3001
```

### 2. รันด้วย Docker Compose

```bash
docker compose up -d --build
```

Docker Compose จะทำสิ่งเหล่านี้ให้อัตโนมัติ:
1. สร้าง PostgreSQL database (port 5850)
2. รัน Liquibase migration สร้างตาราง
3. Build & รัน Backend API (C# .NET 8)
4. Build & รัน Frontend (Next.js)

### 3. เข้าใช้งาน

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

### 4. หยุดระบบ

```bash
docker compose down

# ลบ database volume ด้วย (reset data)
docker compose down -v
```
