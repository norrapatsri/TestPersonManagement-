using Microsoft.AspNetCore.Mvc;
using PersonApi.Data;
using PersonApi.Models;

namespace PersonApi.Controllers;

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
