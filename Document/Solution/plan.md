# Implementation Plan — Person Management Page

## Requirements
1. หน้าเว็บไซต์ 1 หน้า ไม่มีระบบ login
2. ตารางแสดงข้อมูล ชื่อ-นามสกุล, ที่อยู่, วันเกิด, อายุ, Action (View)
3. ปุ่ม View → Modal แสดงข้อมูล read-only + ปุ่มปิด
4. ปุ่ม Add (บนขวาของตาราง) → Modal กรอกข้อมูล + บันทึกลง DB + ปุ่มยกเลิก

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router + TypeScript |
| UI / Styling | Tailwind CSS |
| Server State | TanStack Query |
| Form + Validation | React Hook Form + Zod |
| Backend | C# ASP.NET Core 8 |
| ORM | Entity Framework Core + Npgsql |
| DB Migration | Liquibase XML |
| Database | PostgreSQL 16 |
| Deployment | Docker Compose |

---

## Architecture Overview

```
Browser → Next.js (port 3001) → C# ASP.NET Core 8 (port 5000) → PostgreSQL (port 5432)
```

### Component Flow
```
app/page.tsx  (Server Component)
└── <Providers>           (QueryClientProvider)
    └── <PersonTable>     ('use client')
        ├── usePersons()  → GET /api/persons
        ├── <table>  ชื่อ-นามสกุล | ที่อยู่ | วันเกิด | อายุ | [View]
        ├── <button Add>  → setIsAddOpen(true)
        ├── <AddPersonModal>   React Hook Form + Zod → POST /api/persons
        └── <ViewPersonModal>  read-only + [ปิด]
```

---

## File Structure

### back-end/
```
back-end/
├── Controllers/
│   └── PersonsController.cs
├── Services/
│   ├── IPersonService.cs
│   └── PersonService.cs
├── Models/
│   └── Person.cs
├── DTOs/
│   └── PersonDto.cs
├── Data/
│   └── AppDbContext.cs
├── Liquibase/
│   └── changelog/
│       ├── db.changelog-master.xml
│       └── migrations/
│           └── 001_create_persons_table.xml
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── Dockerfile
└── back-end.csproj
```

### front-end/
```
front-end/
├── src/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       └── providers.tsx
├── components/
│   ├── ui/
│   │   └── Modal.tsx
│   └── persons/
│       ├── PersonTable.tsx
│       ├── AddPersonModal.tsx
│       └── ViewPersonModal.tsx
├── services/
│   ├── api.ts
│   └── person-service.ts
├── hooks/
│   └── use-persons.ts
├── types/
│   └── person.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── Dockerfile
└── package.json
```

### root/
```
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Database Schema

```sql
CREATE TABLE persons (
  id           SERIAL      PRIMARY KEY,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  house_number VARCHAR(20)  NOT NULL,   -- บ้านเลขที่
  street       VARCHAR(200),            -- ถนน (optional)
  sub_district VARCHAR(100) NOT NULL,   -- ตำบล/แขวง
  district     VARCHAR(100) NOT NULL,   -- อำเภอ/เขต
  province     VARCHAR(100) NOT NULL,   -- จังหวัด
  postal_code  CHAR(5)      NOT NULL,   -- รหัสไปรษณีย์
  birth_date   DATE         NOT NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);
```

> **อายุ** คำนวณใน frontend ด้วย `date-fns` → `differenceInYears(new Date(), parseISO(birthDate))`

---

## API Contracts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/persons` | ดึงรายการทั้งหมด |
| GET | `/api/persons/{id}` | ดึงข้อมูลรายคน |
| POST | `/api/persons` | เพิ่มข้อมูลใหม่ |

### POST `/api/persons` — Request
```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "houseNumber": "123",
  "street": "ถ.พระราม 9",
  "subDistrict": "หัวหมาก",
  "district": "บางกะปิ",
  "province": "กรุงเทพมหานคร",
  "postalCode": "10240",
  "birthDate": "1990-05-15"
}
```

### Response Wrapper
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "error detail" }
```

---

## Task Breakdown

### Backend
- [ ] B1 — สร้าง `back-end.csproj` + `Program.cs`
- [ ] B2 — `Models/Person.cs`
- [ ] B3 — `Data/AppDbContext.cs`
- [ ] B4 — `DTOs/PersonDto.cs` (Request, Response, ApiResponse)
- [ ] B5 — `Services/IPersonService.cs` + `PersonService.cs`
- [ ] B6 — `Controllers/PersonsController.cs`
- [ ] B7 — Liquibase XML migration
- [ ] B8 — `appsettings.json` + `appsettings.Development.json`
- [ ] B9 — `Dockerfile` (C# multi-stage)

### Frontend (ทำพร้อม Backend ได้)
- [ ] F1 — สร้าง Next.js project + ติดตั้ง dependencies
- [ ] F2 — `types/person.ts`
- [ ] F3 — `services/api.ts` + `services/person-service.ts`
- [ ] F4 — `hooks/use-persons.ts`
- [ ] F5 — `components/ui/Modal.tsx`
- [ ] F6 — `components/persons/ViewPersonModal.tsx`
- [ ] F7 — `components/persons/AddPersonModal.tsx`
- [ ] F8 — `components/persons/PersonTable.tsx`
- [ ] F9 — `app/providers.tsx` + `app/layout.tsx` + `app/page.tsx`
- [ ] F10 — `Dockerfile` (Next.js standalone)

### DevOps (ทำหลังสุด)
- [ ] D1 — `docker-compose.yml`
- [ ] D2 — `.env.example`
- [ ] D3 — `.gitignore`

---

## Risks & Notes

| ประเด็น | การจัดการ |
|---------|----------|
| CORS | backend ใส่ `AllowAll` policy สำหรับ dev |
| `DateOnly` ใน C# | configure JSON serialization ใน `Program.cs` |
| อายุ | ใช้ `differenceInYears` จาก `date-fns` |
