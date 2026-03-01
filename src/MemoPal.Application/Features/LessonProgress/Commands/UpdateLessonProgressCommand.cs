using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.Reviews.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.LessonProgress.Commands;

public sealed record UpdateLessonProgressCommand(string UserId, string LessonId, LessonProgressUpsertRequest Request) : IRequest<LessonProgressDto>;

public sealed class UpdateLessonProgressCommandHandler : IRequestHandler<UpdateLessonProgressCommand, LessonProgressDto>
{
    private readonly IAppDbContext _db;

    public UpdateLessonProgressCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<LessonProgressDto> Handle(UpdateLessonProgressCommand request, CancellationToken cancellationToken)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == request.LessonId &&
                 !x.IsDeleted &&
                 (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Lesson not found.");

        var now = DateTime.UtcNow;
        var progress = await _db.LessonProgresses.FirstOrDefaultAsync(
            x => x.UserId == request.UserId && x.LessonId == request.LessonId,
            cancellationToken);

        if (progress is null)
        {
            progress = new MemoPal.Domain.Entities.LessonProgress
            {
                Id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!,
                UserId = request.UserId,
                LessonId = request.LessonId,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.LessonProgresses.AddAsync(progress, cancellationToken);
        }

        progress.FirstCompletedDate = request.Request.FirstCompletedDate;
        progress.TotalReviews = request.Request.TotalReviews;
        progress.MasteryLevel = string.IsNullOrWhiteSpace(request.Request.MasteryLevel) ? "new" : request.Request.MasteryLevel;
        progress.LastReviewDate = request.Request.LastReviewDate;
        progress.XpEarned = request.Request.XpEarned;
        progress.UpdatedAt = request.Request.UpdatedAt ?? now;
        progress.LastSyncedAt = request.Request.LastSyncedAt;
        progress.IsDeleted = request.Request.IsDeleted ?? false;
        progress.DeletedAt = request.Request.DeletedAt;

        if (request.Request.ReviewSchedules is not null)
        {
            foreach (var scheduleRequest in request.Request.ReviewSchedules)
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
                schedule.LastSyncedAt = scheduleRequest.LastSyncedAt;
                schedule.IsDeleted = scheduleRequest.IsDeleted ?? false;
                schedule.DeletedAt = scheduleRequest.DeletedAt;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        var schedules = await _db.ReviewSchedules
            .Where(x => x.UserId == request.UserId && x.LessonProgressId == progress.Id && !x.IsDeleted)
            .OrderBy(x => x.ReviewRound)
            .ToListAsync(cancellationToken);
        var reviewDtos = schedules.Select(x => x.Adapt<ReviewScheduleDto>()).ToList();
        return (progress, (IReadOnlyList<ReviewScheduleDto>)reviewDtos).Adapt<LessonProgressDto>();
    }
}


