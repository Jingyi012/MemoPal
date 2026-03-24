using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MemoPal.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.Never
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";
            var payload = new ApiResponse<object?> { Success = false, Message = ex.Message, Data = null };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, SerializerOptions));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var payload = new ApiResponse<object?> { Success = false, Message = "Internal server error.", Data = null };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, SerializerOptions));
        }
    }
}
