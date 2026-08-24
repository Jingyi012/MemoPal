using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.Reviews.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.LessonProgress.Commands;

public sealed record SyncLessonProgressBatchCommand(string UserId, IReadOnlyList<LessonProgressUpsertRequest> Items) : IRequest<ApiResponse<IReadOnlyList<LessonProgressDto>>>;

public sealed class SyncLessonProgressBatchCommandHandler : IRequestHandler<SyncLessonProgressBatchCommand, ApiResponse<IReadOnlyList<LessonProgressDto>>>
{
    private readonly IAppDbContext _db;

    public SyncLessonProgressBatchCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LessonProgressDto>>> Handle(SyncLessonProgressBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.Items.Count == 0) throw new ValidationAppException("Batch payload is empty.");

        var output = new List<LessonProgressDto>(request.Items.Count);
        var now = DateTime.UtcNow;

        foreach (var item in request.Items)
        {
            if (string.IsNullOrWhiteSpace(item.LessonId))
            {
                throw new ValidationAppException("Each lesson progress payload must include lessonId.");
            }

            var lesson = await _db.Lessons.FirstOrDefaultAsync(
                x => x.Id == item.LessonId &&
                     !x.IsDeleted &&
                     (x.IsCustom != true || x.CreatedBy == request.UserId),
                cancellationToken);
            if (lesson is null) throw new NotFoundAppException("Lesson not found.");

            var progress = await _db.LessonProgresses.FirstOrDefaultAsync(
                x => x.UserId == request.UserId && x.LessonId == item.LessonId,
                cancellationToken);

            if (progress is null)
            {
                progress = new MemoPal.Domain.Entities.LessonProgress
                {
                    Id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("D") : item.Id!,
                    UserId = request.UserId,
                    LessonId = item.LessonId!,
                    CreatedAt = item.CreatedAt ?? now
                };
                await _db.LessonProgresses.AddAsync(progress, cancellationToken);
            }

            progress.FirstCompletedDate = item.FirstCompletedDate;
            progress.TotalReviews = item.TotalReviews;
            progress.MasteryLevel = string.IsNullOrWhiteSpace(item.MasteryLevel) ? "new" : item.MasteryLevel;
            progress.LastReviewDate = item.LastReviewDate;
            progress.XpEarned = item.XpEarned;
            progress.UpdatedAt = item.UpdatedAt ?? now;
            progress.IsDeleted = item.IsDeleted ?? false;
            progress.DeletedAt = item.DeletedAt;

            if (item.ReviewSchedules is not null)
            {
                foreach (var scheduleRequest in item.ReviewSchedules)
                {
                    var scheduleId = string.IsNullOrWhiteSpace(scheduleRequest.Id)
                        ? Guid.NewGuid().ToString("D")
                        : scheduleRequest.Id!;
                    var schedule = await _db.ReviewSchedules.FirstOrDefaultAsync(x => x.Id == scheduleId, cancellationToken);
                    if (schedule is null)
                    {
                        schedule = new ReviewSchedule
                        {
                            Id = scheduleId,
                            UserId = request.UserId,
                            LessonProgressId = progress.Id,
                            CreatedAt = scheduleRequest.CreatedAt ?? now
                        };
                        await _db.ReviewSchedules.AddAsync(schedule, cancellationToken);
                    }

                    schedule.ReviewRound = scheduleRequest.ReviewRound;
                    schedule.DueDate = scheduleRequest.DueDate;
                    schedule.Completed = scheduleRequest.Completed;
                    schedule.CompletedDate = scheduleRequest.CompletedDate;
                    schedule.UpdatedAt = scheduleRequest.UpdatedAt ?? now;
                    schedule.IsDeleted = scheduleRequest.IsDeleted ?? false;
                    schedule.DeletedAt = scheduleRequest.DeletedAt;
                }
            }

            var schedules = await _db.ReviewSchedules
                .Where(x => x.UserId == request.UserId && x.LessonProgressId == progress.Id && !x.IsDeleted)
                .OrderBy(x => x.ReviewRound)
                .ToListAsync(cancellationToken);
            var reviewDtos = schedules.Select(x => x.Adapt<ReviewScheduleDto>()).ToList();
            var progressDto = (progress, (IReadOnlyList<ReviewScheduleDto>)reviewDtos).Adapt<LessonProgressDto>();
            output.Add(progressDto);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<LessonProgressDto>>.Ok(output);
    }
}
