# Tasks — Person Management Page

---

## Task 1: สร้าง back-end project scaffold
- **Status**: DONE
- **Order**: 1
- **Assigned**: backend
- **Files**:
  - `back-end/back-end.csproj`
  - `back-end/appsettings.json`
  - `back-end/appsettings.Development.json`
- **Description**: สร้าง ASP.NET Core 8 Web API project พร้อม NuGet packages ที่จำเป็น
- **back-end.csproj ต้องมี packages**:
  ```xml
  <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
  <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
  <PackageReference Include="EFCore.NamingConventions" Version="8.0.0" />
  ```
- **appsettings.json**:
  ```json
  {
    "ConnectionStrings": {
      "DefaultConnection": "Host=localhost;Port=5432;Database=personsdb;Username=postgres;Password=postgres"
    },
    "AllowedHosts": "*"
  }
  ```
- **Dependencies**: none
- **Acceptance Criteria**: `dotnet build` ผ่านโดยไม่มี error

---

## Task 2: สร้าง Liquibase migration — persons table
- **Status**: DONE
- **Order**: 2
- **Assigned**: backend
- **Files**:
  - `back-end/Liquibase/changelog/db.changelog-master.xml`
  - `back-end/Liquibase/changelog/migrations/001_create_persons_table.xml`
- **Description**: สร้าง DB migration สำหรับ table `persons` (normalized address)
- **Schema**:
  ```sql
  CREATE TABLE persons (
    id           SERIAL       PRIMARY KEY,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    house_number VARCHAR(20)  NOT NULL,
    street       VARCHAR(200),
    sub_district VARCHAR(100) NOT NULL,
    district     VARCHAR(100) NOT NULL,
    province     VARCHAR(100) NOT NULL,
    postal_code  CHAR(5)      NOT NULL,
    birth_date   DATE         NOT NULL,
    created_at   TIMESTAMPTZ  DEFAULT NOW()
  );
  ```
- **Dependencies**: Task 1
- **Acceptance Criteria**: รัน Liquibase แล้ว table `persons` ถูกสร้างใน PostgreSQL

---

## Task 3: สร้าง Person Model + AppDbContext
- **Status**: DONE
- **Order**: 3
- **Assigned**: backend
- **Files**:
  - `back-end/Models/Person.cs`
  - `back-end/Data/AppDbContext.cs`
- **Description**: EF Core entity และ DbContext สำหรับ table persons
- **Person.cs structure**:
  ```csharp
  public class Person {
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string HouseNumber { get; set; } = string.Empty;
    public string? Street { get; set; }
    public string SubDistrict { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
    public DateTime CreatedAt { get; set; }
  }
  ```
- **AppDbContext**: `DbSet<Person> Persons` + `OnModelCreating` กำหนด MaxLength ตาม schema
- **Dependencies**: Task 1
- **Acceptance Criteria**: `dotnet build` ผ่าน, EF Core recognize entity ถูกต้อง

---

## Task 4: สร้าง DTOs + ApiResponse wrapper
- **Status**: DONE
- **Order**: 4
- **Assigned**: backend
- **Files**:
  - `back-end/DTOs/PersonDto.cs`
- **Description**: สร้าง Request/Response DTOs และ generic wrappers
- **Classes ที่ต้องมี**:
  ```csharp
  // Request
  public class CreatePersonRequest {
    [Required][MaxLength(100)] public string FirstName
    [Required][MaxLength(100)] public string LastName
    [Required][MaxLength(20)]  public string HouseNumber
    [MaxLength(200)]           public string? Street
    [Required][MaxLength(100)] public string SubDistrict
    [Required][MaxLength(100)] public string District
    [Required][MaxLength(100)] public string Province
    [Required][StringLength(5, MinimumLength = 5)] public string PostalCode
    [Required]                 public DateOnly BirthDate
  }

  // Response
  public class PersonResponse {
    public int Id
    public string FirstName, LastName
    public string HouseNumber, Street?, SubDistrict, District, Province, PostalCode
    public DateOnly BirthDate
    public DateTime CreatedAt
  }

  // Wrappers
  public class ApiResponse<T> { bool Success; string? Message; T? Data }
  ```
- **Dependencies**: Task 1
- **Acceptance Criteria**: `dotnet build` ผ่าน, Data Annotations ครบทุก field

---

## Task 5: สร้าง IPersonService + PersonService
- **Status**: DONE
- **Order**: 5
- **Assigned**: backend
- **Files**:
  - `back-end/Services/IPersonService.cs`
  - `back-end/Services/PersonService.cs`
- **Description**: Business logic layer สำหรับ CRUD persons
- **Interface**:
  ```csharp
  public interface IPersonService {
    Task<List<PersonResponse>> GetAllAsync();
    Task<PersonResponse?> GetByIdAsync(int id);
    Task<PersonResponse> CreateAsync(CreatePersonRequest request);
  }
  ```
- **PersonService**: inject `AppDbContext`, implement interface, map `Person` → `PersonResponse`
- **Dependencies**: Task 3, Task 4
- **Acceptance Criteria**: `dotnet build` ผ่าน, logic แยกออกจาก Controller

---

## Task 6: สร้าง PersonsController + Program.cs
- **Status**: DONE
- **Order**: 6
- **Assigned**: backend
- **Files**:
  - `back-end/Controllers/PersonsController.cs`
  - `back-end/Program.cs`
- **Description**: HTTP layer + DI registration + CORS + global error handler
- **Endpoints**:
  - `GET  /api/persons` → `Ok(ApiResponse<List<PersonResponse>>.Ok(data))`
  - `GET  /api/persons/{id}` → `Ok` หรือ `NotFound`
  - `POST /api/persons` → `CreatedAtAction` 201
- **Program.cs ต้องมี**:
  - `AddControllers()`
  - `AddDbContext<AppDbContext>` + `UseNpgsql` + `UseSnakeCaseNamingConvention()`
  - `AddScoped<IPersonService, PersonService>()`
  - `AddCors("AllowAll")`
  - `UseExceptionHandler` global handler → return `ApiResponse<object>.Fail(...)`
  - configure `JsonSerializerOptions` ให้รองรับ `DateOnly`
- **Dependencies**: Task 5
- **Acceptance Criteria**:
  - `GET /api/persons` ตอบ `200 { success: true, data: [] }`
  - `POST /api/persons` ด้วย body ถูกต้อง → `201`
  - `POST /api/persons` ด้วย body ไม่ครบ → `400`

---

## Task 7: สร้าง back-end Dockerfile
- **Status**: DONE
- **Order**: 7
- **Assigned**: backend
- **Files**:
  - `back-end/Dockerfile`
- **Description**: Multi-stage build สำหรับ C# ASP.NET Core 8
- **Structure**:
  ```dockerfile
  FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
  # restore + publish

  FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runner
  # copy published output, expose 5000, ENTRYPOINT
  ```
- **Dependencies**: Task 6
- **Acceptance Criteria**: `docker build -t backend ./back-end` สำเร็จ

---

## Task 8: สร้าง Next.js project + dependencies
- **Status**: DONE
- **Order**: 8
- **Assigned**: frontend
- **Files**:
  - `front-end/package.json`
  - `front-end/tsconfig.json`
  - `front-end/next.config.ts`
  - `front-end/tailwind.config.ts`
- **Description**: bootstrap Next.js 14 App Router + ติดตั้ง dependencies
- **Dependencies ที่ต้องติดตั้ง**:
  ```
  @tanstack/react-query
  react-hook-form
  @hookform/resolvers
  zod
  date-fns
  ```
- **next.config.ts**: ใส่ `output: 'standalone'`
- **Dependencies**: none
- **Acceptance Criteria**: `npm run dev` start ได้, `npm run build` ผ่าน

---

## Task 9: สร้าง TypeScript types
- **Status**: DONE
- **Order**: 9
- **Assigned**: frontend
- **Files**:
  - `front-end/types/person.ts`
- **Description**: TypeScript interfaces ที่ตรงกับ API response
- **Structure**:
  ```ts
  export interface Person {
    id: number
    firstName: string
    lastName: string
    houseNumber: string
    street: string | null
    subDistrict: string
    district: string
    province: string
    postalCode: string
    birthDate: string   // "YYYY-MM-DD"
    createdAt: string
  }

  export interface CreatePersonInput {
    firstName: string
    lastName: string
    houseNumber: string
    street?: string
    subDistrict: string
    district: string
    province: string
    postalCode: string
    birthDate: string
  }

  export interface ApiResponse<T> {
    success: boolean
    message?: string
    data?: T
  }
  ```
- **Dependencies**: Task 8
- **Acceptance Criteria**: no TypeScript errors, types ตรงกับ API contract ใน Task 6

---

## Task 10: สร้าง API service layer
- **Status**: DONE
- **Order**: 10
- **Assigned**: frontend
- **Files**:
  - `front-end/services/api.ts`
  - `front-end/services/person-service.ts`
- **Description**: typed fetch wrapper + person API calls
- **api.ts**:
  ```ts
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  export async function fetchJson<T>(path, options?): Promise<T>
  // throw Error ถ้า res.ok === false
  ```
- **person-service.ts**:
  ```ts
  export const getPersons = () => fetchJson<Person[]>('/api/persons')
  export const getPersonById = (id: number) => fetchJson<Person>(`/api/persons/${id}`)
  export const createPerson = (data: CreatePersonInput) =>
    fetchJson<Person>('/api/persons', { method: 'POST', body: JSON.stringify(data) })
  ```
- **Dependencies**: Task 9
- **Acceptance Criteria**: functions return typed data, error ถูก throw ถ้า API fail

---

## Task 11: สร้าง TanStack Query hooks
- **Status**: DONE
- **Order**: 11
- **Assigned**: frontend
- **Files**:
  - `front-end/hooks/use-persons.ts`
- **Description**: hooks สำหรับ fetch และ mutate person data
- **Structure**:
  ```ts
  export function usePersons() {
    return useQuery({ queryKey: ['persons'], queryFn: getPersons })
  }

  export function useCreatePerson() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: createPerson,
      onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] })
    })
  }
  ```
- **Dependencies**: Task 10
- **Acceptance Criteria**: หลัง createPerson สำเร็จ → table refresh อัตโนมัติ

---

## Task 12: สร้าง Modal base component
- **Status**: DONE
- **Order**: 12
- **Assigned**: frontend
- **Files**:
  - `front-end/components/ui/Modal.tsx`
- **Description**: reusable modal shell — backdrop, container, title, close button
- **Props interface**:
  ```ts
  interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
  }
  ```
- **Behavior**: คลิก backdrop → `onClose()`, ESC key → `onClose()`
- **Dependencies**: Task 8
- **Acceptance Criteria**: render/hide ได้, backdrop click ปิด modal, accessible (role="dialog")

---

## Task 13: สร้าง ViewPersonModal
- **Status**: DONE
- **Order**: 13
- **Assigned**: frontend
- **Files**:
  - `front-end/components/persons/ViewPersonModal.tsx`
- **Description**: Modal แสดงข้อมูลบุคคล read-only ทุก field รวมอายุที่คำนวณแล้ว
- **Props**:
  ```ts
  interface ViewPersonModalProps {
    person: Person | null
    onClose: () => void
  }
  ```
- **แสดง fields**: ชื่อ-นามสกุล, บ้านเลขที่, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์, วันเกิด, อายุ
- **อายุ**: `differenceInYears(new Date(), parseISO(person.birthDate))` จาก `date-fns`
- **ห้าม**: ไม่มี input/form ใดๆ ใน modal นี้
- **Dependencies**: Task 12, Task 9
- **Acceptance Criteria**: แสดงข้อมูลครบ, ไม่มี editable field, ปุ่มปิดทำงาน

---

## Task 14: สร้าง AddPersonModal
- **Status**: DONE
- **Order**: 14
- **Assigned**: frontend
- **Files**:
  - `front-end/components/persons/AddPersonModal.tsx`
- **Description**: Modal ฟอร์มเพิ่มบุคคลใหม่ พร้อม validation
- **Props**:
  ```ts
  interface AddPersonModalProps {
    open: boolean
    onClose: () => void
  }
  ```
- **Zod schema**:
  ```ts
  const schema = z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    houseNumber: z.string().min(1).max(20),
    street: z.string().max(200).optional(),
    subDistrict: z.string().min(1).max(100),
    district: z.string().min(1).max(100),
    province: z.string().min(1).max(100),
    postalCode: z.string().length(5).regex(/^\d{5}$/),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  ```
- **Behavior**:
  - Submit → `useCreatePerson().mutate(data)` → onSuccess: reset form + `onClose()`
  - ยกเลิก → `onClose()` โดยไม่บันทึก
  - แสดง loading state ระหว่าง submit
  - แสดง error message ถ้า API fail
- **Dependencies**: Task 11, Task 12
- **Acceptance Criteria**:
  - กรอกครบ → บันทึกได้, ตาราง refresh
  - กรอกไม่ครบ → แสดง validation error ใต้ field
  - กด ยกเลิก → ไม่บันทึก, modal ปิด

---

## Task 15: สร้าง PersonTable
- **Status**: DONE
- **Order**: 15
- **Assigned**: frontend
- **Files**:
  - `front-end/components/persons/PersonTable.tsx`
- **Description**: ตารางหลักแสดงรายการบุคคล + จัดการ modal state
- **Columns**: ชื่อ-นามสกุล | ที่อยู่ (รวม) | วันเกิด | อายุ | Action
- **ที่อยู่รวม**: `${houseNumber} ${street ?? ''} ต.${subDistrict} อ.${district} จ.${province} ${postalCode}`
- **State**:
  ```ts
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  ```
- **บนขวาของตาราง**: ปุ่ม "เพิ่มข้อมูล" → `setIsAddOpen(true)`
- **แต่ละ row**: ปุ่ม "ดูข้อมูล" → `setSelectedPerson(person)`
- **Loading state**: แสดง skeleton หรือ "กำลังโหลด..." ขณะ fetch
- **Empty state**: แสดง "ไม่มีข้อมูล" ถ้า list ว่าง
- **Dependencies**: Task 11, Task 13, Task 14
- **Acceptance Criteria**:
  - ตารางแสดงข้อมูลจาก API
  - ปุ่ม Add เปิด AddPersonModal
  - ปุ่ม View เปิด ViewPersonModal พร้อมข้อมูลของ row นั้น
  - อายุคำนวณถูกต้อง

---

## Task 16: สร้าง app layout + providers + page
- **Status**: DONE
- **Order**: 16
- **Assigned**: frontend
- **Files**:
  - `front-end/src/app/providers.tsx`
  - `front-end/src/app/layout.tsx`
  - `front-end/src/app/page.tsx`
- **Description**: root layout, TanStack Query provider, และ home page
- **providers.tsx**: `'use client'` — wrap children ด้วย `QueryClientProvider`
- **layout.tsx**: import Providers + Tailwind global styles, set `lang="th"`
- **page.tsx**: Server Component — render `<PersonTable />`
- **Dependencies**: Task 15
- **Acceptance Criteria**: เปิด `http://localhost:3001` เห็นตาราง, ไม่มี hydration error

---

## Task 17: สร้าง front-end Dockerfile
- **Status**: DONE
- **Order**: 17
- **Assigned**: frontend
- **Files**:
  - `front-end/Dockerfile`
- **Description**: Multi-stage Next.js standalone build
- **Structure**:
  ```dockerfile
  FROM node:20-alpine AS deps   # npm ci
  FROM node:20-alpine AS build  # npm run build
  FROM node:20-alpine AS runner # copy standalone + static, non-root user
  ```
- **Dependencies**: Task 16
- **Acceptance Criteria**: `docker build -t frontend ./front-end` สำเร็จ

---

## Task 18: สร้าง Docker Compose + env
- **Status**: DONE
- **Order**: 18
- **Assigned**: backend
- **Files**:
  - `docker-compose.yml`
  - `.env.example`
  - `.gitignore`
- **Description**: orchestrate 3 services: db, backend, frontend
- **Services**:
  - `db`: postgres:16-alpine, healthcheck `pg_isready`, volume `pgdata`
  - `backend`: build `./back-end`, port 5000, depends_on db healthy
  - `frontend`: build `./front-end`, port 3001, depends_on backend, env `NEXT_PUBLIC_API_URL=http://localhost:5000`
- **.env.example**:
  ```env
  DB_NAME=personsdb
  DB_USER=postgres
  DB_PASSWORD=postgres
  DB_PORT=5432
  API_PORT=5000
  FRONTEND_PORT=3001
  ```
- **Dependencies**: Task 7, Task 17
- **Acceptance Criteria**: `docker compose up --build` → ทุก service healthy, เปิด `http://localhost:3001` ใช้งานได้
