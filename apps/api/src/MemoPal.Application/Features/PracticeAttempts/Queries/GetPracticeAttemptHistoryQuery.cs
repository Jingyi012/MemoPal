using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PracticeAttempts.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PracticeAttempts.Queries;

public sealed record GetPracticeAttemptHistoryQuery(string UserId, string MemorySetId)
    : IRequest<ApiResponse<IReadOnlyList<PracticeAttemptDto>>>;

public sealed class GetPracticeAttemptHistoryQueryHandler
    : IRequestHandler<GetPracticeAttemptHistoryQuery, ApiResponse<IReadOnlyList<PracticeAttemptDto>>>
{
    private readonly IAppDbContext _db;

    public GetPracticeAttemptHistoryQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<PracticeAttemptDto>>> Handle(
        GetPracticeAttemptHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var attempts = await _db.PracticeAttempts
            .AsNoTracking()
            .Include(attempt => attempt.Responses)
            .Where(attempt =>
                attempt.UserId == request.UserId &&
                attempt.MemorySetId == request.MemorySetId &&
                !attempt.IsDeleted)
            .OrderByDescending(attempt => attempt.CompletedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (attempts.Count == 0)
        {
            return ApiResponse<IReadOnlyList<PracticeAttemptDto>>.Ok([]);
        }

        var attemptIds = attempts.Select(attempt => attempt.Id).ToList();
        var user = await _db.Users
            .AsNoTracking()
            .FirstAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken);
        var xpByAttemptId = await _db.XpEvents
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId && x.SourceId != null && attemptIds.Contains(x.SourceId) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.SourceId!, cancellationToken);
        var currentNextReviewAt = await _db.MemoryReviewSchedules
            .AsNoTracking()
            .Where(schedule =>
                schedule.UserId == request.UserId &&
                schedule.MemorySetId == request.MemorySetId &&
                !schedule.IsDeleted)
            .Select(schedule => (DateTime?)schedule.DueAt)
            .MinAsync(cancellationToken);
        var nextReviews = await _db.MemoryReviewSchedules
            .AsNoTracking()
            .Where(schedule =>
                schedule.UserId == request.UserId &&
                !schedule.IsDeleted &&
                schedule.LastAttemptId != null &&
                attemptIds.Contains(schedule.LastAttemptId))
            .GroupBy(schedule => schedule.LastAttemptId!)
            .Select(group => new { AttemptId = group.Key, NextReviewAt = group.Min(schedule => schedule.DueAt) })
            .ToDictionaryAsync(item => item.AttemptId, item => (DateTime?)item.NextReviewAt, cancellationToken);

        var latestAttemptId = attempts[0].Id;
        var history = attempts
            .Select(attempt =>
            {
                xpByAttemptId.TryGetValue(attempt.Id, out var xpEvent);
                return ToDto(
                attempt,
                nextReviews.TryGetValue(attempt.Id, out var nextReviewAt)
                    ? nextReviewAt
                    : attempt.Id == latestAttemptId
                        ? currentNextReviewAt
                        : null,
                xpEvent?.XpAmount ?? 0,
                xpEvent?.SourceType,
                user.TotalXp,
                user.Level);
            })
            .ToList();

        return ApiResponse<IReadOnlyList<PracticeAttemptDto>>.Ok(history);
    }

    private static PracticeAttemptDto ToDto(
        PracticeAttempt attempt,
        DateTime? nextReviewAt,
        int xpEarned,
        string? xpSourceType,
        int totalXp,
        int currentLevel) => new(
        attempt.Id,
        attempt.ClientAttemptId,
        attempt.MemorySetId,
        attempt.TechniqueKey,
        attempt.Mode,
        attempt.StartedAt,
        attempt.CompletedAt,
        attempt.DurationMs,
        attempt.CorrectCount,
        attempt.FirstAttemptCorrectCount,
        attempt.TotalCount,
        nextReviewAt,
        xpEarned,
        xpSourceType,
        totalXp,
        currentLevel,
        currentLevel,
        attempt.Responses.Select(response => new PracticeResponseDto(
            response.Id,
            response.MemoryItemId,
            response.IsCorrect,
            response.AttemptCount,
            response.ResponseMs,
            response.CreatedAt,
            response.UpdatedAt,
            response.CreatedBy,
            response.UpdatedBy)).ToList(),
        attempt.CreatedAt,
        attempt.UpdatedAt,
        attempt.CreatedBy,
        attempt.UpdatedBy);
}
