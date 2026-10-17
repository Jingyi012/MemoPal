using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Companion.DTOs;
using MemoPal.Application.Features.Companion.Queries;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Companion.Commands;

public sealed record GreetCompanionCommand(string UserId) : IRequest<ApiResponse<CompanionDto>>;

public sealed class GreetCompanionCommandHandler(IAppDbContext db) : IRequestHandler<GreetCompanionCommand, ApiResponse<CompanionDto>>
{
    public async Task<ApiResponse<CompanionDto>> Handle(GreetCompanionCommand request, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().Where(x => x.Id == request.UserId && !x.IsDeleted)
            .Select(x => new { x.SelectedAvatarId, x.Level }).FirstOrDefaultAsync(ct);
        var avatarId = await GetCompanionQueryHandler.ResolveAvatarId(db, user?.SelectedAvatarId, user?.Level ?? 1, ct);
        if (!string.IsNullOrWhiteSpace(avatarId))
        {
            var now = DateTime.UtcNow;
            var greetingSourceId = $"greeting:{now:yyyyMMdd}";
            try
            {
                await db.CreateExecutionStrategy().ExecuteAsync(async () =>
                {
                    db.ClearTracking();
                    await using var transaction = await db.BeginTransactionIfSupportedAsync(ct);
                    var bond = await db.CompanionBonds.FirstOrDefaultAsync(
                        x => x.UserId == request.UserId && x.AvatarId == avatarId && !x.IsDeleted, ct);
                    if (bond is null)
                    {
                        bond = new CompanionBond { Id = Guid.NewGuid().ToString("D"), UserId = request.UserId, AvatarId = avatarId };
                        await db.CompanionBonds.AddAsync(bond, ct);
                    }
                    if (bond.LastGreetingDateUtc?.Date != now.Date)
                    {
                        bond.BondPoints += 1;
                        bond.LastGreetingDateUtc = now.Date;
                        await db.CompanionMemories.AddAsync(new CompanionMemory
                        {
                            Id = Guid.NewGuid().ToString("D"), UserId = request.UserId, AvatarId = avatarId,
                            Type = "greeting", OccurredAt = now, SummaryEn = "You said hello to your companion.",
                            SummaryZh = "你和伙伴打了声招呼。", SourceId = greetingSourceId
                        }, ct);
                        await db.SaveChangesAsync(ct);
                    }
                    if (transaction is not null) await transaction.CommitAsync(ct);
                });
            }
            catch (DbUpdateException)
            {
                db.ClearTracking();
                // The competing request can only win by committing the unique per-day event.
                var alreadyGreeted = await db.CompanionMemories.AsNoTracking().AnyAsync(
                    x => x.UserId == request.UserId && x.AvatarId == avatarId &&
                         x.SourceId == greetingSourceId && !x.IsDeleted, ct);
                if (!alreadyGreeted) throw;
            }
        }
        return await new GetCompanionQueryHandler(db).Handle(new(request.UserId), ct);
    }
}
