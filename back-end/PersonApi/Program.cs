using Microsoft.EntityFrameworkCore;
using PersonApi.BusinessFlow;
using PersonApi.Converters;
using PersonApi.Data;
using PersonApi.Exceptions;
using PersonApi.Repositories;

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

// Repositories
builder.Services.AddScoped<IPersonRepository, PersonRepository>();

// BusinessFlow
builder.Services.AddScoped<IPersonBusiness, PersonBusiness>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

WebApplication app = builder.Build();

// Global exception handler
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        Exception? exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;

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
