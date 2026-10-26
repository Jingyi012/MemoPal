namespace MemoPal.Application.Features.Education.MemoryBridge;

public interface IEducationMemoryBridgeLock
{
    Task<IDisposable> AcquireAsync(string key, CancellationToken cancellationToken);
}
