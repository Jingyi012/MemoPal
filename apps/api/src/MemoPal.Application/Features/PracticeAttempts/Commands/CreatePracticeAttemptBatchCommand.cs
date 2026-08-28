using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PracticeAttempts.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PracticeAttempts.Commands;

public sealed record CreatePracticeAttemptBatchCommand(
    string UserId,
    PracticeAttemptBatchRequest Request)
    : IRequest<ApiResponse<IReadOnlyList<PracticeAttemptDto>>>;

public sealed class CreatePracticeAttemptBatchCommandHandler
    : IRequestHandler<CreatePracticeAttemptBatchCommand, ApiResponse<IReadOnlyList<PracticeAttemptDto>>>
{
    private static readonly int[] RecallIntervalsDays = [1, 3, 7, 14, 30];
    private readonly IAppDbContext _db;

    public CreatePracticeAttemptBatchCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<PracticeAttemptDto>>> Handle(
        CreatePracticeAttemptBatchCommand request,
        CancellationToken cancellationToken)
    {
        var inputs = request.Request.Attempts ?? [];
        if (inputs.Count is < 1 or > 20)
        {
            throw new ValidationAppException("Provide between 1 and 20 practice attempts.");
        }

        var duplicateClientId = inputs
            .GroupBy(x => x.ClientAttemptId, StringComparer.Ordinal)
            .FirstOrDefault(group => group.Count() > 1)?.Key;
        if (!string.IsNullOrWhiteSpace(duplicateClientId))
        {
            throw new ValidationAppException("clientAttemptId must be unique within a batch.");
        }

        var results = new List<PracticeAttemptDto>(inputs.Count);
        foreach (var input in inputs)
        {
            results.Add(await CreateOrResolveAsync(request.UserId, input, cancellationToken));
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<PracticeAttemptDto>>.Ok(results);
    }

    private async Task<PracticeAttemptDto> CreateOrResolveAsync(
        string userId,
        PracticeAttemptInput input,
        CancellationToken cancellationToken)
    {
        ValidateInput(input);

        var existing = await _db.PracticeAttempts
            .AsNoTracking()
            .Include(x => x.Responses)
            .FirstOrDefaultAsync(
                x => x.UserId == userId && x.ClientAttemptId == input.ClientAttemptId,
                cancellationToken);
        if (existing is not null)
        {
            var existingResponseItemIds = existing.Responses.Select(response => response.MemoryItemId).ToList();
            var existingNextDue = await _db.MemoryReviewSchedules
                .AsNoTracking()
                .Where(x => x.UserId == userId &&
                            x.MemorySetId == existing.MemorySetId &&
                            existingResponseItemIds.Contains(x.MemoryItemId) &&
                            !x.IsDeleted)
                .Select(x => (DateTime?)x.DueAt)
                .MinAsync(cancellationToken);
            return ToDto(existing, existingNextDue);
        }

        var memorySet = await _db.MemorySets
            .AsNoTracking()
            .Include(x => x.Items.Where(item => !item.IsDeleted))
            .FirstOrDefaultAsync(
                x => x.Id == input.MemorySetId && x.UserId == userId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        var itemById = memorySet.Items.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var responseIds = input.Responses.Select(x => x.MemoryItemId).ToList();
        if (responseIds.Any(string.IsNullOrWhiteSpace) || responseIds.Distinct(StringComparer.Ordinal).Count() != responseIds.Count)
        {
            throw new ValidationAppException("Each memory item can appear only once in an attempt.");
        }
        if (responseIds.Any(id => !itemById.ContainsKey(id)))
        {
            throw new ValidationAppException("Every response must belong to the selected memory set.");
        }

        var now = DateTime.UtcNow;
        var attempt = new PracticeAttempt
        {
            Id = Guid.NewGuid().ToString("D"),
            UserId = userId,
            MemorySetId = memorySet.Id,
            ClientAttemptId = input.ClientAttemptId.Trim(),
            TechniqueKey = memorySet.TechniqueKey,
            Mode = input.Mode,
            StartedAt = input.StartedAt ?? now,
            CompletedAt = now,
            DurationMs = input.DurationMs,
            CorrectCount = input.Responses.Count(x => x.IsCorrect),
            FirstAttemptCorrectCount = input.Responses.Count(x => x.IsCorrect && x.AttemptCount == 1),
            TotalCount = input.Responses.Count,
            Responses = input.Responses.Select(response => new PracticeResponse
            {
                Id = Guid.NewGuid().ToString("D"),
                MemoryItemId = response.MemoryItemId,
                IsCorrect = response.IsCorrect,
                AttemptCount = response.AttemptCount,
                ResponseMs = response.ResponseMs
            }).ToList()
        };

        await _db.PracticeAttempts.AddAsync(attempt, cancellationToken);
        var schedules = await _db.MemoryReviewSchedules
            .Where(x => x.UserId == userId && responseIds.Contains(x.MemoryItemId) && !x.IsDeleted)
            .ToListAsync(cancellationToken);

        DateTime? nextReviewAt = schedules.Count == 0 ? null : schedules.Min(schedule => schedule.DueAt);
        if (input.Mode == PracticeModes.Recall)
        {
            foreach (var response in input.Responses)
            {
                var schedule = schedules.FirstOrDefault(x => x.MemoryItemId == response.MemoryItemId);
                if (schedule is null)
                {
                    schedule = new MemoryReviewSchedule
                    {
                        Id = Guid.NewGuid().ToString("D"),
                        UserId = userId,
                        MemorySetId = memorySet.Id,
                        MemoryItemId = response.MemoryItemId
                    };
                    await _db.MemoryReviewSchedules.AddAsync(schedule, cancellationToken);
                    schedules.Add(schedule);
                }

                schedule.LastAttemptId = attempt.Id;
                schedule.LastResultCorrect = response.IsCorrect;
                var isEarlyCorrectRecall = response.IsCorrect && schedule.DueAt > now;
                if (isEarlyCorrectRecall)
                {
                    // An early success is useful practice, but must not let a
                    // user fast-forward the spaced-repetition schedule.
                }
                else if (response.IsCorrect)
                {
                    schedule.ReviewCount += 1;
                    schedule.IntervalDays = RecallIntervalsDays[Math.Min(schedule.ReviewCount - 1, RecallIntervalsDays.Length - 1)];
                    schedule.DueAt = now.AddDays(schedule.IntervalDays);
                }
                else
                {
                    schedule.ReviewCount = 0;
                    schedule.IntervalDays = 0;
                    schedule.DueAt = now.AddMinutes(10);
                }
                schedule.UpdatedAt = now;
                nextReviewAt = nextReviewAt is null || schedule.DueAt < nextReviewAt
                    ? schedule.DueAt
                    : nextReviewAt;
            }
        }

        // A completed practice attempt is the authoritative learning activity
        // event. Update the persisted streak here so every client (including a
        // freshly logged-in device) sees the same value on the next profile
        // request; relying on client-side counters made the Home banner stay at
        // zero after a successful session.
        await UpdateUserStreakAsync(userId, now, cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);
        return ToDto(attempt, nextReviewAt);
    }

    private async Task UpdateUserStreakAsync(
        string userId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var stats = await _db.UserStats
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (stats is null)
        {
            stats = new UserStats
            {
                UserId = userId,
                CreatedAt = now,
                UpdatedAt = now
            };
            await _db.UserStats.AddAsync(stats, cancellationToken);
        }

        var lastActiveDay = stats.LastActiveDate?.Date;
        var dayGap = lastActiveDay is null ? null : (int?)(now.Date - lastActiveDay.Value).TotalDays;
        stats.CurrentStreak = dayGap switch
        {
            null => 1,
            <= 0 => Math.Max(1, stats.CurrentStreak),
            1 => Math.Max(1, stats.CurrentStreak + 1),
            _ => 1
        };
        stats.LongestStreak = Math.Max(stats.LongestStreak, stats.CurrentStreak);
        stats.LastActiveDate = now;
        stats.UpdatedAt = now;
        stats.IsDeleted = false;
        stats.DeletedAt = null;
    }

    private static void ValidateInput(PracticeAttemptInput input)
    {
        if (string.IsNullOrWhiteSpace(input.ClientAttemptId) || input.ClientAttemptId.Trim().Length > 64)
            throw new ValidationAppException("clientAttemptId is required and must be at most 64 characters.");
        if (string.IsNullOrWhiteSpace(input.MemorySetId))
            throw new ValidationAppException("memorySetId is required.");
        if (!PracticeModes.All.Contains(input.Mode))
            throw new ValidationAppException("mode must be recall or rehearsal.");
        if (input.DurationMs is < 0 or > 86_400_000)
            throw new ValidationAppException("durationMs must be between 0 and 86400000.");
        if (input.Responses.Count is < 1 or > 100)
            throw new ValidationAppException("Provide between 1 and 100 responses.");
        if (input.Responses.Any(x => x.AttemptCount < 1 || x.ResponseMs < 0))
            throw new ValidationAppException("attemptCount must be positive and responseMs cannot be negative.");
        if (input.StartedAt is { } startedAt && startedAt > DateTime.UtcNow.AddMinutes(5))
            throw new ValidationAppException("startedAt cannot be in the future.");
    }

    private static PracticeAttemptDto ToDto(PracticeAttempt attempt, DateTime? nextReviewAt) => new(
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
