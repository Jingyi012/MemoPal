using System.Security.Cryptography;
using System.Text;
using MemoPal.Application.Features.Education.MemoryBridge;

namespace MemoPal.Infrastructure.Education;

/// <summary>
/// Bounded, process-local serialization for duplicate bridge requests. Database unique indexes
/// remain the cross-process arbiter; this lock also makes non-relational test providers deterministic.
/// </summary>
public sealed class StripedEducationMemoryBridgeLock : IEducationMemoryBridgeLock
{
    private readonly SemaphoreSlim[] _stripes = Enumerable.Range(0, 128)
        .Select(_ => new SemaphoreSlim(1, 1)).ToArray();

    public async Task<IDisposable> AcquireAsync(string key, CancellationToken cancellationToken)
    {
        var digest = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        var stripeIndex = (int)(BitConverter.ToUInt32(digest, 0) % (uint)_stripes.Length);
        var stripe = _stripes[stripeIndex];
        await stripe.WaitAsync(cancellationToken);
        return new Releaser(stripe);
    }

    private sealed class Releaser(SemaphoreSlim stripe) : IDisposable
    {
        private SemaphoreSlim? _stripe = stripe;
        public void Dispose() => Interlocked.Exchange(ref _stripe, null)?.Release();
    }
}
