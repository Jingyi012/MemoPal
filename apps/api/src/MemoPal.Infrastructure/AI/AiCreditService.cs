using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;

namespace MemoPal.Infrastructure.AI;

public sealed class AiCreditService(AppDbContext db, IOptions<AiCreditOptions> options,
    IOptions<AiTextGenerationOptions> textOptions,
    IOptions<AiImageGenerationOptions> imageOptions) : IAiCredits
{
    // Fixed stripes keep the test/in-memory lock table bounded. Production uses database locks.
    private static readonly SemaphoreSlim[] Gates = Enumerable.Range(0, 64).Select(_ => new SemaphoreSlim(1)).ToArray();
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private sealed record Allocation(string GrantId, int Amount);

    internal async Task<T> LockedAsync<T>(string userId, Func<Task<T>> action, CancellationToken ct)
    {
        var key = BitConverter.ToInt64(SHA256.HashData(Encoding.UTF8.GetBytes(userId)), 0);
        var gate = Gates[(int)((ulong)key % (ulong)Gates.Length)];
        var useLocalGate = !db.Database.IsRelational();
        if (useLocalGate) await gate.WaitAsync(ct);
        try
        {
            return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                db.ChangeTracker.Clear();
                await using var transaction = db.Database.IsRelational()
                    ? await db.Database.BeginTransactionAsync(ct) : null;
                if (transaction is not null)
                    await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({key})", ct);
                var result = await action();
                await db.SaveChangesAsync(ct);
                if (transaction is not null) await transaction.CommitAsync(ct);
                return result;
            });
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            throw new ConflictAppException("This credit reference has already been used.");
        }
        finally { if (useLocalGate) gate.Release(); }
    }

    public async Task<AiCreditBalance> BalanceAsync(string userId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var grants = await db.AiCreditGrants.AsNoTracking().Where(x => x.UserId == userId && x.Remaining > 0 &&
            (!x.ExpiresAt.HasValue || x.ExpiresAt > now)).ToListAsync(ct);
        var subscription = grants.Where(x => x.Source == "subscription").Sum(x => x.Remaining);
        return new AiCreditBalance(grants.Sum(x => x.Remaining), subscription,
            grants.Where(x => x.Source != "subscription").Sum(x => x.Remaining),
            grants.Min(x => x.ExpiresAt), TextCost(), options.Value.ImageCost, ImagesEnabled(), false, imageOptions.Value.IsConfigured);
    }

    public Task ReconcileAsync(string userId, CancellationToken ct) => LockedAsync(userId, async () =>
    {
        await ExpireAsync(userId, ct);
        return true;
    }, ct);

    public async Task<IReadOnlyList<AiCreditHistoryItem>> HistoryAsync(string userId, int skip, CancellationToken ct)
    {
        return await db.AiCreditEntries.AsNoTracking().Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id).Skip(Math.Clamp(skip, 0, 100000)).Take(50)
            .Select(x => new AiCreditHistoryItem(x.Id, x.Kind, x.Amount, x.CreatedAt)).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<AiGenerationView>> GenerationsAsync(string userId, CancellationToken ct)
    {
        return await db.AiGenerations.AsNoTracking().Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt).Take(50)
            .Select(x => new AiGenerationView(x.Id, x.Kind, x.Status, x.Reserved, x.Charged, x.ResultJson, x.CreatedAt)).ToListAsync(ct);
    }

    public Task<AiCreditReservation> ReserveAsync(string userId, string requestId, string kind, object input,
        int count, CancellationToken ct, int? maxCredits = null)
    {
        if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 64)
            throw new ValidationAppException("A requestId of 1-64 characters is required for AI generation.");
        if (count is < 1 or > 100 || kind is not ("number-peg-text" or "palace-text" or "number-peg-image"))
            throw new ValidationAppException("Invalid AI generation request.");
        var inputJson = JsonSerializer.Serialize(input, Json);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(kind + inputJson)));
        return LockedAsync(userId, async () =>
        {
            await ExpireAsync(userId, ct);
            var existing = await db.AiGenerations.SingleOrDefaultAsync(x => x.UserId == userId && x.RequestId == requestId, ct);
            if (existing is not null)
            {
                if (existing.RequestHash != hash) throw new ConflictAppException("This requestId belongs to different generation input.");
                return new AiCreditReservation(existing.Id, existing.Status, existing.ResultJson, existing.UnitCost);
            }
            if (kind == "number-peg-image" && !ImagesEnabled())
                throw new AppException("Image generation is not configured yet.", 503);
            var unitCost = kind == "number-peg-image" ? options.Value.ImageCost : TextCost();
            var amount = checked(count * unitCost);
            if (maxCredits.HasValue && amount > maxCredits.Value)
                throw new ConflictAppException("AI credit pricing changed. Review the current price before generating.");
            var now = DateTime.UtcNow;
            var minuteAgo = now.AddMinutes(-1);
            if (await db.AiGenerations.CountAsync(x => x.UserId == userId && x.CreatedAt >= minuteAgo, ct) >= 20)
                throw new AppException("Too many generation requests. Please wait a minute and try again.", 429);
            if (await db.AiGenerations.CountAsync(x => x.UserId == userId && x.LeaseExpiresAt > now && (x.Status == "reserved" || x.Status == "processing"), ct) >= 3)
                throw new AppException("Please wait for your current generations to finish.", 429);
            var grants = await db.AiCreditGrants.Where(x => x.UserId == userId && x.Remaining > 0 &&
                (!x.ExpiresAt.HasValue || x.ExpiresAt > now)).OrderBy(x => x.ExpiresAt ?? DateTime.MaxValue).ThenBy(x => x.CreatedAt).ThenBy(x => x.Id).ToListAsync(ct);
            if (grants.Sum(x => x.Remaining) < amount)
                throw new AppException("Insufficient AI credits. Add credits or use a free template / edit manually.", 402);
            var remaining = amount;
            var allocations = new List<Allocation>();
            foreach (var grant in grants)
            {
                var take = Math.Min(remaining, grant.Remaining);
                if (take == 0) break;
                grant.Remaining -= take;
                remaining -= take;
                allocations.Add(new(grant.Id, take));
            }
            var job = new AiGeneration
            {
                Id = Guid.NewGuid().ToString("N"), UserId = userId, RequestId = requestId,
                RequestHash = hash, Kind = kind, UnitCost = unitCost, Reserved = amount,
                LeaseExpiresAt = now.AddMinutes(15), AllocationsJson = JsonSerializer.Serialize(allocations),
                InputJson = kind == "number-peg-image" ? inputJson : null
            };
            db.AiGenerations.Add(job);
            Entry(userId, job.Id, "reserve", -amount);
            return new AiCreditReservation(job.Id, "new", null, unitCost);
        }, ct);
    }

    public Task CompleteAsync(string userId, string id, int successCount, object result, AiImageContent? image, CancellationToken ct) => LockedAsync(userId, async () =>
    {
        var job = await OwnedJob(userId, id, ct);
        if (job.Status == "completed") return true;
        if (job.Status == "failed") throw new ConflictAppException("This generation has already expired or failed.");
        var charge = checked(successCount * job.UnitCost);
        if (successCount < 0 || charge > job.Reserved) throw new InvalidOperationException("Invalid AI settlement.");
        await ReleaseAsync(job, charge, ct);
        job.Status = "completed";
        job.Charged = charge;
        job.ResultJson = JsonSerializer.Serialize(result, Json);
        job.ImageBytes = image?.Bytes;
        job.ImageContentType = image?.ContentType;
        job.InputJson = null;
        // Release the accounting hold and replace it with the final debit in the ledger.
        Entry(userId, job.Id, "charge", -charge);
        return true;
    }, ct);

    public Task FailAsync(string userId, string id, CancellationToken ct) => LockedAsync(userId, async () =>
    {
        var job = await OwnedJob(userId, id, ct);
        if (job.Status is "reserved" or "processing")
        {
            await ReleaseAsync(job, 0, ct);
            job.Status = "failed";
            job.InputJson = null;
        }
        return true;
    }, ct);

    public Task GrantAsync(string userId, string reference, string source, int amount, DateTime? expiresAt, CancellationToken ct)
    {
        if (amount is < 1 or > 1000000 || string.IsNullOrWhiteSpace(reference) || reference.Length > 200 ||
            source is not ("subscription" or "purchase" or "manual") ||
            expiresAt.HasValue && (expiresAt.Value.Kind != DateTimeKind.Utc || expiresAt <= DateTime.UtcNow))
            throw new ValidationAppException("Invalid credit grant, reference, or UTC expiry.");
        return LockedAsync(userId, async () =>
        {
            if (!await db.Users.AnyAsync(x => x.Id == userId && !x.IsDeleted, ct)) throw new NotFoundAppException("User not found.");
            var existing = await db.AiCreditGrants.SingleOrDefaultAsync(x => x.Reference == reference, ct);
            if (existing is not null)
            {
                if (existing.UserId != userId || existing.Amount != amount || existing.Source != source || existing.ExpiresAt != expiresAt)
                    throw new ConflictAppException("Credit reference has already been used.");
                return true;
            }
            db.AiCreditGrants.Add(new AiCreditGrant { Id = Guid.NewGuid().ToString("N"), UserId = userId,
                Reference = reference, Source = source, Amount = amount, Remaining = amount, ExpiresAt = expiresAt });
            Entry(userId, reference, "grant", amount);
            return true;
        }, ct);
    }

    public async Task<AiImageContent> ImageAsync(string userId, string id, CancellationToken ct)
    {
        var job = await db.AiGenerations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.UserId == userId && x.Status == "completed", ct);
        if (job?.ImageBytes is null || job.ImageContentType is null) throw new NotFoundAppException("Image not found.");
        return new(job.ImageBytes, job.ImageContentType);
    }

    private Task<AiGeneration> OwnedJob(string userId, string id, CancellationToken ct) =>
        db.AiGenerations.SingleAsync(x => x.Id == id && x.UserId == userId, ct);

    private async Task ReleaseAsync(AiGeneration job, int charge, CancellationToken ct)
    {
        var allocations = JsonSerializer.Deserialize<List<Allocation>>(job.AllocationsJson)!;
        var remainingCharge = charge;
        foreach (var allocation in allocations)
        {
            var consumed = Math.Min(remainingCharge, allocation.Amount);
            remainingCharge -= consumed;
            var grant = await db.AiCreditGrants.SingleAsync(x => x.Id == allocation.GrantId, ct);
            grant.Remaining += allocation.Amount - consumed;
        }
        Entry(job.UserId, job.Id, "release", job.Reserved);
    }

    private async Task ExpireAsync(string userId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var stale = await db.AiGenerations.Where(x => x.UserId == userId && (x.Status == "reserved" || x.Status == "processing") && x.LeaseExpiresAt <= now).ToListAsync(ct);
        foreach (var job in stale)
        {
            await ReleaseAsync(job, 0, ct);
            job.Status = "failed";
            job.InputJson = null;
        }
        var expired = await db.AiCreditGrants.Where(x => x.UserId == userId && x.ExpiresAt <= now).ToListAsync(ct);
        foreach (var grant in expired.Where(x => x.Remaining > 0))
        {
            // A late release can return expired credits; each expiration event has its own reference.
            Entry(userId, Guid.NewGuid().ToString("N"), "expire", -grant.Remaining);
            grant.Remaining = 0;
        }
    }

    private void Entry(string userId, string reference, string kind, int amount) => db.AiCreditEntries.Add(new AiCreditEntry
        { Id = Guid.NewGuid().ToString("N"), UserId = userId, Reference = reference, Kind = kind, Amount = amount });

    private int TextCost() => textOptions.Value.IsConfigured
        ? options.Value.TextCost : 0;
    private bool ImagesEnabled() => options.Value.ImagesEnabled && imageOptions.Value.IsConfigured;
}
