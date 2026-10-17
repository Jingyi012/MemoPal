using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Companion.DTOs;
using MemoPal.Application.Common.Settings;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Companion.Queries;

public sealed record GetCompanionQuery(string UserId) : IRequest<ApiResponse<CompanionDto>>;

public sealed class GetCompanionQueryHandler(IAppDbContext db) : IRequestHandler<GetCompanionQuery, ApiResponse<CompanionDto>>
{
    public async Task<ApiResponse<CompanionDto>> Handle(GetCompanionQuery request, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().Where(x => x.Id == request.UserId && !x.IsDeleted)
            .Select(x => new { x.CompanionAvatarId, x.Level }).FirstOrDefaultAsync(ct);
        var avatarId = await ResolveAvatarId(db, user?.CompanionAvatarId, user?.Level ?? 1, ct);
        var today = DateTime.UtcNow.Date;
        var count = string.IsNullOrWhiteSpace(avatarId) ? 0 : await db.CompanionMemories.AsNoTracking().CountAsync(
            x => x.UserId == request.UserId && x.AvatarId == avatarId && x.Type == CompanionMemoryTypes.Practice &&
                 !x.IsDeleted && x.OccurredAt >= today && x.OccurredAt < today.AddDays(1), ct);
        var points = 0;
        IReadOnlyList<CompanionMemoryDto> memories = [];
        var look = new CompanionLookDto(null, null, null, null);
        if (!string.IsNullOrWhiteSpace(avatarId))
        {
            points = await db.CompanionBonds.AsNoTracking().Where(x => x.UserId == request.UserId && x.AvatarId == avatarId && !x.IsDeleted)
                .Select(x => (int?)x.BondPoints).FirstOrDefaultAsync(ct) ?? 0;
            var feed = db.CompanionMemories.AsNoTracking()
                .Where(x => x.UserId == request.UserId && x.AvatarId == avatarId && !x.IsDeleted);
            var milestoneAndGreetingMemories = await feed.Where(x => x.Type != CompanionMemoryTypes.Practice)
                .OrderByDescending(x => x.OccurredAt).ThenByDescending(x => x.Id).Take(9)
                .Select(x => new CompanionMemoryDto(x.Id, x.Type, x.OccurredAt, x.SummaryEn, x.SummaryZh)).ToListAsync(ct);
            var recentPracticeMemory = await feed.Where(x => x.Type == CompanionMemoryTypes.Practice)
                .OrderByDescending(x => x.OccurredAt).ThenByDescending(x => x.Id).Take(1)
                .Select(x => new CompanionMemoryDto(x.Id, x.Type, x.OccurredAt, x.SummaryEn, x.SummaryZh)).ToListAsync(ct);
            memories = milestoneAndGreetingMemories.Concat(recentPracticeMemory)
                .OrderByDescending(x => x.OccurredAt).ThenByDescending(x => x.Id).Take(10).ToList();
            look = await db.CompanionLooks.AsNoTracking().Where(x => x.UserId == request.UserId && x.AvatarId == avatarId && !x.IsDeleted)
                .Select(x => new CompanionLookDto(x.HeadwearId, x.BodywearId, x.BackwearId, x.HandItemId))
                .FirstOrDefaultAsync(ct) ?? look;
            // An admin can withdraw an item after it has been equipped. Keep the
            // saved choice, but do not render withdrawn or incompatible layers.
            var avatarKey = await db.AvatarDefinitions.AsNoTracking().Where(x => x.Id == avatarId)
                .Select(x => x.Key).FirstAsync(ct);
            var equippedIds = new[] { look.HeadwearId, look.BodywearId, look.BackwearId, look.HandItemId }
                .Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x!).ToArray();
            if (equippedIds.Length > 0)
            {
                var userLevel = user?.Level ?? 1;
                var available = await db.AppearanceDefinitions.AsNoTracking()
                    .Where(x => equippedIds.Contains(x.Id) && x.IsActive && !x.IsDeleted &&
                                x.CompanionAvatarKey == avatarKey && x.RequiredLevel <= userLevel)
                    .Select(x => new { x.Id, x.ItemType }).ToListAsync(ct);
                string? Keep(string? id, string slot) => available.Any(x => x.Id == id && x.ItemType == slot) ? id : null;
                look = new CompanionLookDto(
                    Keep(look.HeadwearId, AppearanceItemTypes.Headwear),
                    Keep(look.BodywearId, AppearanceItemTypes.Bodywear),
                    Keep(look.BackwearId, AppearanceItemTypes.Backwear),
                    Keep(look.HandItemId, AppearanceItemTypes.HandItem));
            }
        }
        var configuredStages = await CompanionBondStageSettings.GetAsync(db, ct);
        var (stage, progress, toNext) = Stage(points, configuredStages);
        var stages = configuredStages.Select(x => new CompanionBondStageDto(x.Key, x.Points, x.TitleEn, x.TitleZh)).ToList();
        return ApiResponse<CompanionDto>.Ok(new(avatarId, points, stage, progress, toNext, count, memories, look, stages));
    }

    internal static async Task<string?> ResolveAvatarId(IAppDbContext db, string? selectedAvatarId, int level, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(selectedAvatarId) && await db.AvatarDefinitions.AsNoTracking().AnyAsync(
                x => x.Id == selectedAvatarId && x.IsActive && !x.IsDeleted && x.RequiredLevel <= level, ct))
            return selectedAvatarId;
        return await db.AvatarDefinitions.AsNoTracking().Where(x => x.IsActive && !x.IsDeleted && x.RequiredLevel <= level)
            .OrderBy(x => x.SortOrder).ThenBy(x => x.RequiredLevel).ThenBy(x => x.Key)
            .Select(x => x.Id).FirstOrDefaultAsync(ct);
    }

    internal static (string Stage, int Progress, int ToNext) Stage(int points, IReadOnlyList<CompanionBondStageConfig>? configured = null)
    {
        var stages = configured is { Count: >= 2 } ? configured : CompanionBondStageDefaults.All;
        var index = 0;
        for (var i = 1; i < stages.Count; i++)
        {
            if (points < stages[i].Points) break;
            index = i;
        }
        var floor = stages[index].Points;
        if (index == stages.Count - 1) return (stages[index].Key, 100, 0);
        var ceiling = stages[index + 1].Points;
        var progress = (int)Math.Clamp((points - floor) * 100d / Math.Max(1, ceiling - floor), 0, 100);
        return (stages[index].Key, progress, Math.Max(0, ceiling - points));
    }
}
