using MemoPal.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace MemoPal.UnitTests;

public sealed class PersistenceConflictResponseTests
{
    [Fact]
    public async Task Concurrent_course_writes_return_a_retryable_conflict_without_database_details()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new DbUpdateConcurrencyException("private database details"),
            NullLogger<ExceptionHandlingMiddleware>.Instance);
        await middleware.Invoke(context);
        Assert.Equal(409, context.Response.StatusCode);
        context.Response.Body.Position = 0;
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.Contains("Reload before saving", body);
        Assert.DoesNotContain("private database details", body);
    }
}
