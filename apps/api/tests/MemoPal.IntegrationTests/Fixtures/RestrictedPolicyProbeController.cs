using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace MemoPal.IntegrationTests.Fixtures;

// Test assembly only: prove that a future unclassified MVC action fails closed.
[Authorize]
[Route("restricted-policy-test-probe")]
public sealed class RestrictedPolicyProbeController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { reachedAction = true });
}

public sealed class RestrictedPolicyLogCapture : ILoggerProvider
{
    public ConcurrentQueue<string> Messages { get; } = new();
    public ILogger CreateLogger(string categoryName) => new Capture(Messages);
    public void Dispose() { }

    private sealed class Capture(ConcurrentQueue<string> messages) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state,
            Exception? exception, Func<TState, Exception?, string> formatter) => messages.Enqueue(formatter(state, exception));
    }
}
