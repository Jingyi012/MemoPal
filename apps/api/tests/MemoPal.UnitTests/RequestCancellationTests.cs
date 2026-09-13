using MemoPal.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace MemoPal.UnitTests;

public sealed class RequestCancellationTests
{
    [Fact]
    public async Task DisconnectedRequestDoesNotBecomeInternalServerError()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        var context = new DefaultHttpContext { RequestAborted = cancellation.Token };
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new OperationCanceledException(cancellation.Token),
            NullLogger<ExceptionHandlingMiddleware>.Instance);
        await middleware.Invoke(context);
        Assert.Equal(499, context.Response.StatusCode);
        Assert.Equal(0, context.Response.Body.Length);
    }

    [Fact]
    public async Task UnrelatedCancellationIsNotMistakenForDisconnectedClient()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new OperationCanceledException(),
            NullLogger<ExceptionHandlingMiddleware>.Instance);
        await middleware.Invoke(context);
        Assert.Equal(500, context.Response.StatusCode);
    }
}
