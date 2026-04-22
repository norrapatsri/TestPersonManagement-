---
name: backend
description: "Backend knowledge base for C# ASP.NET Core 8 REST API. Use when designing, implementing, or debugging backend code in back-end/ directory. Covers layered architecture (Controllers → BusinessFlow → Repositories → DbContext), Entity Framework Core, DTOs, Data Annotations validation, and custom exception handling."
---

# Backend Knowledge - C# ASP.NET Core 8

You are an expert backend developer with deep knowledge of ASP.NET Core 8, Entity Framework Core, and REST API design. Your role is to build secure, well-structured API services.

---

## TABLE OF CONTENTS
1. Project Structure
2. Layered Architecture
3. Program.cs Setup
4. Controller Pattern
5. BusinessFlow Pattern (Interface + Implementation)
6. Repository Pattern (Interface + Implementation)
7. Models (Entity + DTOs)
8. DbContext & DbSet
9. Liquibase Database Migrations
10. Custom Exception Handling
11. Converters
12. Input Validation (Data Annotations)
13. Best Practices & Anti-Patterns
14. Quick Reference

---

## 1. Project Structure

```
back-end/
├── {ProjectName}/                    # Main API project
│   ├── Controllers/                  # API endpoints (thin layer)
│   │   ├── HealthController.cs
│   │   └── {Resource}sController.cs
│   ├── BusinessFlow/                 # Business logic layer
│   │   ├── I{Resource}Business.cs    # Interface
│   │   └── {Resource}Business.cs     # Implementation + mapping
│   ├── Repositories/                 # Data access layer
│   │   ├── I{Resource}Repository.cs  # Interface
│   │   └── {Resource}Repository.cs   # Implementation (EF Core)
│   ├── Models/                       # Entity + DTOs per resource
│   │   ├── {Resource}Entity.cs       # EF Core entity → maps to DB table
│   │   └── {Resource}Dto.cs          # Request, Response, ApiResponse, PageResponse
│   ├── Data/                         # EF Core DbContext
│   │   └── AppDbContext.cs
│   ├── Converters/                   # JSON converters
│   │   └── DateOnlyJsonConverter.cs
│   ├── Exceptions/                   # Custom exceptions + error response
│   │   ├── AppException.cs           # Base + derived exceptions
│   │   └── ErrorResponse.cs
│   ├── Liquibase/                    # DB migrations (XML)
│   │   └── changelog/
│   │       ├── db.changelog-master.xml
│   │       └── migrations/
│   │           └── 001_create_{table}_table.xml
│   ├── Program.cs                    # App bootstrap + DI registration
│   ├── {ProjectName}.csproj
│   ├── appsettings.json
│   └── appsettings.Development.json
├── {ProjectName}.Test/               # Unit tests
├── {SolutionName}.sln
└── Dockerfile
```

## 2. Layered Architecture

```
Request → Controller → BusinessFlow → Repository → DbContext → Database
             ↓              ↓
Response ← Controller ← BusinessFlow
```

| Layer | Knows About | Does NOT Know About |
|-------|------------|-------------------|
| Controllers | BusinessFlow interfaces, DTOs, HTTP | Database, EF Core, Repositories |
| BusinessFlow | Repository interfaces, Models, DTOs | HTTP, Controllers |
| Repositories | DbContext, Entity models | HTTP, Business logic, DTOs |
| Models/Entity | EF Core attributes, DB mapping | Business logic, HTTP |
| Models/DTOs | Validation attributes | Database, EF Core |

### Why This Matters
- BusinessFlow layer ทำ mapping Entity ↔ DTO และ business logic
- Repository layer จัดการ data access เท่านั้น
- Controllers stay thin (validate → delegate → respond)

## 3. Program.cs Setup

```csharp
using Microsoft.EntityFrameworkCore;
using {Namespace}.BusinessFlow;
using {Namespace}.Converters;
using {Namespace}.Data;
using {Namespace}.Exceptions;
using {Namespace}.Repositories;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Controllers with DateOnly JSON support
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
    });

// Database (PostgreSQL + EF Core + snake_case naming)
string connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());

// Repositories (Scoped = per HTTP request)
builder.Services.AddScoped<I{Resource}Repository, {Resource}Repository>();

// BusinessFlow (Scoped = per HTTP request)
builder.Services.AddScoped<I{Resource}Business, {Resource}Business>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

WebApplication app = builder.Build();

// Global exception handler (AppException → proper status code)
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        Exception? exception = context.Features
            .Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;

        (int statusCode, string message) = exception switch
        {
            AppException appEx => (appEx.StatusCode, appEx.Message),
            _ => (500, "Internal server error")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ErrorResponse
        {
            ErrorCode = statusCode.ToString(),
            Message = message
        });
    });
});

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### DI Registration Order
1. `AddDbContext<AppDbContext>` — database
2. `AddScoped<IRepository, Repository>` — data access
3. `AddScoped<IBusiness, Business>` — business logic

## 4. Controller Pattern

Controllers ใช้ explicit route (ไม่ใช้ `[Route("api/[controller]")]`) และ inject BusinessFlow interface

```csharp
using Microsoft.AspNetCore.Mvc;
using {Namespace}.BusinessFlow;
using {Namespace}.Models;

namespace {Namespace}.Controllers;

[ApiController]
public class {Resource}sController(I{Resource}Business business) : ControllerBase
{
    [HttpGet("api/{resources}")]
    public List<{Resource}Response> GetAll()
    {
        return business.GetAll();
    }

    [HttpGet("api/{resources}/{id}")]
    public {Resource}Response GetById(int id)
    {
        return business.GetById(id);
    }

    [HttpPost("api/{resources}")]
    public {Resource}Response Create([FromBody] Create{Resource}Request request)
    {
        return business.Create(request);
    }
}
```

### Key Points
- ใช้ primary constructor injection: `{Resource}sController(I{Resource}Business business)`
- Route ระบุตรงที่ `[HttpGet("api/{resources}")]` ไม่ใช้ `[Route]` attribute บน class
- Return type เป็น DTO โดยตรง (ไม่ wrap ด้วย `IActionResult`)
- Error handling ผ่าน exception → global handler จัดการ status code

### Health Controller

```csharp
[ApiController]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet("healthcheck")]
    public IActionResult Check()
    {
        bool dbOk = db.Database.CanConnect();
        object status = new
        {
            status = dbOk ? "healthy" : "unhealthy",
            database = dbOk ? "connected" : "unreachable"
        };

        return dbOk
            ? Ok(ApiResponse<object>.Ok(status))
            : StatusCode(503, ApiResponse<object>.Fail("Database unreachable"));
    }
}
```

## 5. BusinessFlow Pattern (Interface + Implementation)

BusinessFlow layer รับผิดชอบ: business logic, mapping Entity ↔ DTO, throw exceptions

```csharp
// BusinessFlow/I{Resource}Business.cs
using {Namespace}.Models;

namespace {Namespace}.BusinessFlow;

public interface I{Resource}Business
{
    List<{Resource}Response> GetAll();
    {Resource}Response? GetById(int id);
    {Resource}Response Create(Create{Resource}Request request);
}

// BusinessFlow/{Resource}Business.cs
using {Namespace}.Models;
using {Namespace}.Repositories;

namespace {Namespace}.BusinessFlow;

public class {Resource}Business(I{Resource}Repository repo) : I{Resource}Business
{
    public List<{Resource}Response> GetAll()
    {
        return repo.GetAll().Select(MapToResponse).ToList();
    }

    public {Resource}Response? GetById(int id)
    {
        {Resource}Entity? entity = repo.GetById(id);
        if (entity is null)
            throw new NotFoundException($"{Resource} with id {id} not found");

        return MapToResponse(entity);
    }

    public {Resource}Response Create(Create{Resource}Request request)
    {
        {Resource}Entity entity = new {Resource}Entity
        {
            // map request fields → entity fields
            CreatedAt = DateTime.UtcNow
        };

        repo.Add(entity);
        return MapToResponse(entity);
    }

    // Private mapping method — Entity → Response DTO
    private static {Resource}Response MapToResponse({Resource}Entity e) => new()
    {
        // map entity fields → response fields
    };
}
```

## 6. Repository Pattern (Interface + Implementation)

Repository layer จัดการ data access ผ่าน DbContext เท่านั้น ไม่มี business logic

```csharp
// Repositories/I{Resource}Repository.cs
using {Namespace}.Models;

namespace {Namespace}.Repositories;

public interface I{Resource}Repository
{
    List<{Resource}Entity> GetAll();
    {Resource}Entity? GetById(int id);
    {Resource}Entity Add({Resource}Entity entity);
}

// Repositories/{Resource}Repository.cs
using {Namespace}.Data;
using {Namespace}.Models;

namespace {Namespace}.Repositories;

public class {Resource}Repository(AppDbContext db) : I{Resource}Repository
{
    public List<{Resource}Entity> GetAll() =>
        db.{Resources}
            .OrderBy(e => e.Id)
            .ToList();

    public {Resource}Entity? GetById(int id) => db.{Resources}.Find(id);

    public {Resource}Entity Add({Resource}Entity entity)
    {
        db.{Resources}.Add(entity);
        db.SaveChanges();
        return entity;
    }
}
```

## 7. Models (Entity + DTOs)

### Entity — maps to DB table

```csharp
// Models/{Resource}Entity.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace {Namespace}.Models;

[Table("{table_name}")]  // ระบุชื่อ table ให้ตรงกับ Liquibase migration (plural, snake_case)
public class {Resource}Entity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    [Column("column_name")]             // snake_case column name
    public string PropertyName { get; set; } = string.Empty;

    [MaxLength(200)]
    [Column("nullable_column")]
    public string? NullableProperty { get; set; }

    [Required]
    [Column("fixed_length_col", TypeName = "CHAR(5)")]  // ระบุ DB type ตรงๆ
    public string FixedLengthProperty { get; set; } = string.Empty;

    [Column("date_col")]
    public DateOnly DateProperty { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### Key Entity Conventions
- `[Table("table_name")]` — ชื่อ table ต้องตรงกับ Liquibase migration (plural, snake_case)
- `[Column("column_name")]` — ระบุ column name เป็น snake_case
- `[Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]` — auto-increment PK
- `[Column(TypeName = "CHAR(5)")]` — ระบุ DB type ตรงๆ เมื่อต้องการ

### DTOs — Request / Response / Wrappers

```csharp
// Models/{Resource}Dto.cs
using System.ComponentModel.DataAnnotations;

namespace {Namespace}.Models;

// --- Request DTOs ---
public class Create{Resource}Request
{
    [Required]
    [MaxLength(100)]
    public string PropertyName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? OptionalProperty { get; set; }

    [Required]
    [StringLength(5, MinimumLength = 5, ErrorMessage = "Must be exactly 5 characters")]
    [RegularExpression(@"^\d{5}$", ErrorMessage = "Must contain digits only")]
    public string ExactLengthProperty { get; set; } = string.Empty;

    [Required]
    public DateOnly DateProperty { get; set; }
}

// --- Response DTOs ---
public class {Resource}Response
{
    public int Id { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public string? OptionalProperty { get; set; }
    public DateOnly DateProperty { get; set; }
    public DateTime CreatedAt { get; set; }
}

// --- Pagination ---
public class PageResponse<T>
{
    public List<T> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

// --- Wrappers ---
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message) =>
        new() { Success = false, Message = message };
}
```

## 8. DbContext & DbSet

```csharp
// Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using {Namespace}.Models;

namespace {Namespace}.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<{Resource}Entity> {Resources} { get; set; }
    // เพิ่ม DbSet ต่อเมื่อมี Entity ใหม่
}
```

### How to Add a New Entity
1. สร้าง Entity class ใน `Models/` พร้อม `[Table("table_name")]`
2. เพิ่ม `DbSet<NewEntity> NewEntities { get; set; }` ใน `AppDbContext`
3. สร้าง Liquibase migration ใน `Liquibase/changelog/migrations/`
4. เพิ่ม include ใน `db.changelog-master.xml`

### DbContext Registration (Program.cs)
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());
```
- `UseNpgsql` — PostgreSQL provider
- `UseSnakeCaseNamingConvention()` — auto map PascalCase → snake_case (จาก `EFCore.NamingConventions`)

## 9. Liquibase Database Migrations

ใช้ **Liquibase 4.27** (ไม่ใช้ EF Core Migrations) สำหรับจัดการ database schema ทั้งหมด โดยรันผ่าน Docker Compose service `migrate`

### File Structure

```
Liquibase/changelog/
├── db.changelog-master.xml          # Master file — include ทุก migration
└── migrations/
    ├── 001_create_{table}_table.xml
    ├── 002_add_{column}_column.xml
    └── ...
```

### Master Changelog

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <include file="migrations/001_create_{table}_table.xml"
             relativeToChangelogFile="true" />

    <!-- เพิ่ม migration ใหม่ต่อท้ายที่นี่ -->
</databaseChangeLog>
```

### Migration File Example — Create Table

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="001" author="backend">
        <createTable tableName="{table_name}">
            <column name="id" type="SERIAL">
                <constraints primaryKey="true" nullable="false" />
            </column>
            <column name="name" type="VARCHAR(100)">
                <constraints nullable="false" />
            </column>
            <column name="description" type="VARCHAR(500)">
                <constraints nullable="true" />
            </column>
            <column name="created_at" type="TIMESTAMPTZ" defaultValueComputed="NOW()">
                <constraints nullable="true" />
            </column>
        </createTable>
    </changeSet>

</databaseChangeLog>
```

### How to Add a New Migration

1. สร้างไฟล์ใหม่ใน `Liquibase/changelog/migrations/` ตั้งชื่อ `NNN_description.xml`
   - ตัวเลข NNN เรียงลำดับต่อจากอันล่าสุด เช่น `002_add_phone_column.xml`
2. เพิ่ม `<include>` ใน `db.changelog-master.xml`
3. `changeSet id` ต้อง unique — ใช้เลขเดียวกับชื่อไฟล์ เช่น `id="002"`
4. `author` ใช้ `"backend"`

### Common Migration Operations

```xml
<!-- เพิ่ม column -->
<changeSet id="002" author="backend">
    <addColumn tableName="{table_name}">
        <column name="phone" type="VARCHAR(20)">
            <constraints nullable="true" />
        </column>
    </addColumn>
</changeSet>

<!-- เพิ่ม index -->
<changeSet id="003" author="backend">
    <createIndex tableName="{table_name}" indexName="idx_{table}_{column}">
        <column name="{column_name}" />
    </createIndex>
</changeSet>

<!-- สร้างตารางใหม่พร้อม foreign key -->
<changeSet id="004" author="backend">
    <createTable tableName="{child_table}">
        <column name="id" type="SERIAL">
            <constraints primaryKey="true" nullable="false" />
        </column>
        <column name="{parent}_id" type="INTEGER">
            <constraints nullable="false"
                         foreignKeyName="fk_{child}_{parent}"
                         references="{parent_table}(id)" />
        </column>
        <column name="value" type="VARCHAR(500)">
            <constraints nullable="false" />
        </column>
    </createTable>
</changeSet>
```

### How Liquibase Runs (Docker Compose)

```yaml
migrate:
  image: liquibase/liquibase:4.27
  depends_on:
    db:
      condition: service_healthy
  volumes:
    - ./back-end/Liquibase/changelog:/liquibase/changelog
  command: >
    --url=jdbc:postgresql://db:5432/{dbname}
    --username={user}
    --changeLogFile=changelog/db.changelog-master.xml
    update
```

- รันอัตโนมัติหลัง DB healthy ก่อน backend start
- Liquibase track สถานะ migration ใน table `databasechangelog` — จะไม่รัน changeset ซ้ำ
- ห้ามแก้ไข changeset ที่รันไปแล้ว — สร้างอันใหม่แทน

### Naming Conventions (Liquibase ↔ Entity)

| Liquibase (SQL) | Entity (C#) | Rule |
|-----------------|-------------|------|
| `{table_name}` (table) | `[Table("{table_name}")]` | plural, snake_case |
| `{column_name}` (column) | `[Column("{column_name}")]` | snake_case |
| `SERIAL` | `DatabaseGeneratedOption.Identity` | auto-increment PK |
| `VARCHAR(n)` | `[MaxLength(n)]` | string length |
| `CHAR(n)` | `[Column(TypeName = "CHAR(n)")]` | fixed-length |
| `DATE` | `DateOnly` | date without time |
| `TIMESTAMPTZ` | `DateTime` | timestamp with timezone |
| `INTEGER` | `int` | integer |
| `BOOLEAN` | `bool` | boolean |
| `NUMERIC(p,s)` | `[Column(TypeName = "NUMERIC(p,s)")]` + `decimal` | decimal |

## 10. Custom Exception Handling

### Exception Classes

```csharp
// Exceptions/AppException.cs
namespace {Namespace}.Exceptions;

public abstract class AppException(string message, int statusCode) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public class NotFoundException(string message = "Resource not found")
    : AppException(message, StatusCodes.Status404NotFound);

public class ValidationException(string message = "Validation failed")
    : AppException(message, StatusCodes.Status400BadRequest);

public class ConflictException(string message = "Resource already exists")
    : AppException(message, StatusCodes.Status409Conflict);

// Exceptions/ErrorResponse.cs
public class ErrorResponse
{
    public string ErrorCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
```

### How It Works
1. BusinessFlow throw exception เช่น `throw new NotFoundException("Resource not found")`
2. Global exception handler ใน `Program.cs` จับ `AppException` แล้ว return `ErrorResponse` พร้อม status code ที่ถูกต้อง
3. Exception อื่นๆ จะ return 500 Internal server error

## 11. Converters

```csharp
// Converters/DateOnlyJsonConverter.cs — แปลง DateOnly ↔ "yyyy-MM-dd" string
public class DateOnlyJsonConverter : JsonConverter<DateOnly>
{
    private const string Format = "yyyy-MM-dd";

    public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        string value = reader.GetString()
            ?? throw new JsonException("Expected a string value for DateOnly.");
        return DateOnly.ParseExact(value, Format);
    }

    public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(Format));
    }
}
```

ลงทะเบียนใน Program.cs:
```csharp
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
    });
```

## 12. Input Validation (Data Annotations)

ASP.NET Core validates `[ApiController]` request bodies automatically via Data Annotations.

```csharp
// Annotations ที่ใช้บน DTO properties:
[Required]                                          // Field is mandatory
[MaxLength(100)]                                    // String max length
[StringLength(5, MinimumLength = 5)]                // Exact length
[RegularExpression(@"^\d{5}$", ErrorMessage = "…")] // Regex pattern
[Range(0, double.MaxValue)]                         // Numeric range
```

When validation fails, ASP.NET Core automatically returns HTTP 400 with `ValidationProblemDetails` — no extra code needed.

## 13. Best Practices & Anti-Patterns

### DO
- แยก layer ชัดเจน: Controller → BusinessFlow → Repository → DbContext
- ใช้ Interface + Implementation สำหรับ BusinessFlow และ Repository
- Register DI ด้วย `AddScoped` (per HTTP request)
- ใช้ primary constructor injection: `public class Foo(IBar bar)`
- ใช้ `[Table("table_name")]` และ `[Column("column_name")]` บน Entity ให้ตรงกับ Liquibase
- ใช้ `UseSnakeCaseNamingConvention()` สำหรับ EF Core
- ใช้ Liquibase XML สำหรับ DB migrations (ไม่ใช้ EF Core migrations)
- Throw custom exceptions (`NotFoundException`, `ValidationException`) จาก BusinessFlow
- Entity และ DTOs แยกกัน — Entity map กับ DB, DTOs map กับ API contract

### DON'T
- อย่าใช้ `var` — ระบุ type ให้ชัดเจนเสมอ เช่น `PersonEntity? entity = ...` ไม่ใช่ `var entity = ...`
- อย่าใส่ business logic ใน Controllers
- อย่าเข้าถึง DbContext จาก Controllers โดยตรง (ผ่าน Repository เท่านั้น)
- อย่า expose Entity class ใน API response — ใช้ DTOs เสมอ
- อย่าใช้ `AddSingleton` สำหรับ DbContext (ต้องเป็น `AddScoped`)
- อย่า catch exception ใน BusinessFlow ถ้าไม่จำเป็นต้อง transform

## 14. Quick Reference

| Task | Solution |
|------|----------|
| New endpoint | Controller action → BusinessFlow method → Repository method |
| New resource | Entity + DTO + IRepository + Repository + IBusiness + Business + Controller |
| New DB table | Liquibase migration XML → Entity class → `DbSet<T>` in AppDbContext |
| Input validation | Data Annotations on Request DTO + `[ApiController]` (auto 400) |
| DI registration | `builder.Services.AddScoped<IFoo, Foo>()` in Program.cs |
| Error: not found | `throw new NotFoundException("...")` in BusinessFlow |
| Error: validation | `throw new ValidationException("...")` in BusinessFlow |
| DB query | EF Core LINQ via `DbSet<T>` in Repository |
| Column naming | snake_case via `[Column("name")]` + `UseSnakeCaseNamingConvention()` |
| DateOnly JSON | `DateOnlyJsonConverter` registered in Program.cs |
| DB migrations | Liquibase XML in `Liquibase/changelog/migrations/` |
| NuGet packages | `.csproj` — EF Core, Npgsql, EFCore.NamingConventions |
