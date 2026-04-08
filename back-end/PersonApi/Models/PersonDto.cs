using System.ComponentModel.DataAnnotations;

namespace PersonApi.Models;

// --- Request DTOs ---

public class CreatePersonRequest
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string HouseNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Street { get; set; }

    [Required]
    [MaxLength(100)]
    public string SubDistrict { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string District { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Province { get; set; } = string.Empty;

    [Required]
    [StringLength(5, MinimumLength = 5, ErrorMessage = "PostalCode must be exactly 5 characters")]
    [RegularExpression(@"^\d{5}$", ErrorMessage = "PostalCode must contain digits only")]
    public string PostalCode { get; set; } = string.Empty;

    [Required]
    public DateOnly BirthDate { get; set; }
}

// --- Response DTOs ---

public class PersonResponse
{
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
