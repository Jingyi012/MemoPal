using System.Globalization;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PracticeAttempts.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PracticeAttempts.Queries;

public sealed record GetPracticeStatsQuery(string UserId)
    : IRequest<ApiResponse<PracticeStatsDto>>;

/// <summary>
/// Builds the dashboard metrics from completed practice attempts so the home
/// screen always reflects the server's source of truth immediately after a
/// session is saved. These values intentionally are not stored denormalized in
/// UserStats, avoiding a second counter that can drift from practice history.
/// </summary>
public sealed class GetPracticeStatsQueryHandler
    : IRequestHandler<GetPracticeStatsQuery, ApiResponse<PracticeStatsDto>>
{
    private readonly IAppDbContext _db;

    public GetPracticeStatsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PracticeStatsDto>> Handle(
        GetPracticeStatsQuery request,
        CancellationToken cancellationToken)
    {
        var attempts = await _db.PracticeAttempts
            .AsNoTracking()
            .Where(attempt => attempt.UserId == request.UserId && !attempt.IsDeleted)
            .Select(attempt => new AttemptSummary(
                attempt.CompletedAt,
                attempt.CorrectCount,
                attempt.TotalCount,
                attempt.Responses.Select(response => response.MemoryItemId).ToList()))
            .ToListAsync(cancellationToken);

        var totalQuestions = attempts.Sum(attempt => Math.Max(0, attempt.TotalCount));
        var correctQuestions = attempts.Sum(attempt => Math.Clamp(attempt.CorrectCount, 0, attempt.TotalCount));
        var accuracy = totalQuestions == 0
            ? 0
            : (int)Math.Round(correctQuestions * 100d / totalQuestions, MidpointRounding.AwayFromZero);
        var wordsLearned = attempts
            .SelectMany(attempt => attempt.MemoryItemIds)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .Count();

        var today = DateTime.UtcNow.Date;
        var weeklyActivity = Enumerable.Range(0, 7)
            .Select(offset => today.AddDays(offset - 6))
            .Select(date => new PracticeActivityDayDto(
                date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                attempts.Count(attempt => attempt.CompletedAt.ToUniversalTime().Date == date)))
            .ToList();

        return ApiResponse<PracticeStatsDto>.Ok(new PracticeStatsDto(
            attempts.Count,
            wordsLearned,
            accuracy,
            weeklyActivity));
    }

    private sealed record AttemptSummary(
        DateTime CompletedAt,
        int CorrectCount,
        int TotalCount,
        IReadOnlyList<string> MemoryItemIds);
}
