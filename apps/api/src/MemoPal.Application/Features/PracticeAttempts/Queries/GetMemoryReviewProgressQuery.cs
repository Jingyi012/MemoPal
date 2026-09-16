using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PracticeAttempts.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PracticeAttempts.Queries;

public sealed record GetMemoryReviewProgressQuery(string UserId, string MemorySetId)
    : IRequest<ApiResponse<MemoryReviewProgressDto>>;

public sealed class GetMemoryReviewProgressQueryHandler(IAppDbContext db)
    : IRequestHandler<GetMemoryReviewProgressQuery, ApiResponse<MemoryReviewProgressDto>>
{
    public async Task<ApiResponse<MemoryReviewProgressDto>> Handle(
        GetMemoryReviewProgressQuery request, CancellationToken cancellationToken)
    {
        if (!await db.MemorySets.AsNoTracking().AnyAsync(
            set => set.Id == request.MemorySetId && set.UserId == request.UserId && !set.IsDeleted,
            cancellationToken))
            throw new NotFoundAppException("Memory set not found.");

        var itemIds = await db.MemoryItems.AsNoTracking()
            .Where(item => item.MemorySetId == request.MemorySetId && !item.IsDeleted)
            .OrderBy(item => item.Position).Select(item => item.Id).ToListAsync(cancellationToken);
        var recalls = db.PracticeAttempts.AsNoTracking().Where(attempt =>
            attempt.UserId == request.UserId && attempt.MemorySetId == request.MemorySetId &&
            attempt.Mode == PracticeModes.Recall && !attempt.IsDeleted);
        // History is paginated; count all saved rounds, not only the latest page.
        var rounds = await recalls.OrderBy(attempt => attempt.CompletedAt).ThenBy(attempt => attempt.Id)
            .Select(attempt => attempt.Responses.Where(response => !response.IsDeleted)
                .Select(response => response.MemoryItemId).ToList()).ToListAsync(cancellationToken);
        var seenItems = new HashSet<string>(StringComparer.Ordinal);
        var reviewCount = 0;
        foreach (var round in rounds)
        {
            // Learning a newly added subset is still initial learning, even
            // when other items in this memory have already been reviewed.
            if (round.Any(seenItems.Contains)) reviewCount++;
            seenItems.UnionWith(round);
        }
        var recallCount = rounds.Count;
        var countsByItem = await recalls.SelectMany(attempt => attempt.Responses)
            .Where(response => !response.IsDeleted && itemIds.Contains(response.MemoryItemId))
            .GroupBy(response => response.MemoryItemId)
            .Select(group => new { ItemId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(group => group.ItemId, group => group.Count, cancellationToken);
        var schedules = await db.MemoryReviewSchedules.AsNoTracking()
            .Where(schedule => schedule.UserId == request.UserId &&
                schedule.MemorySetId == request.MemorySetId && !schedule.IsDeleted &&
                itemIds.Contains(schedule.MemoryItemId))
            .ToDictionaryAsync(schedule => schedule.MemoryItemId, cancellationToken);
        var stages = MemoryReviewSchedule.StageIntervalsDays;
        var now = DateTime.UtcNow;
        var items = itemIds.Select(id =>
        {
            schedules.TryGetValue(id, out var schedule);
            return new MemoryItemReviewProgressDto(
                id, countsByItem.GetValueOrDefault(id),
                Math.Clamp(schedule?.ReviewCount ?? 0, 0, stages.Count),
                schedule?.GetRemainingRecallsToLongTerm() ?? stages.Count,
                schedule is not null && schedule.IntervalDays == 0,
                schedule?.DueAt,
                schedule is not null && schedule.DueAt <= now);
        }).ToList();

        return ApiResponse<MemoryReviewProgressDto>.Ok(new(
            request.MemorySetId, recallCount, reviewCount, stages,
            items.Count(item => item.RemainingRecalls == 0),
            items.Count == 0 ? null : items.Max(item => item.RemainingRecalls),
            items.Select(item => item.DueAt).DefaultIfEmpty(null).Min(), items));
    }
}
