namespace PersonApi.Exceptions;

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

public class UnauthorizedException(string message = "Unauthorized")
    : AppException(message, StatusCodes.Status401Unauthorized);

public class ForbiddenException(string message = "Forbidden")
    : AppException(message, StatusCodes.Status403Forbidden);
