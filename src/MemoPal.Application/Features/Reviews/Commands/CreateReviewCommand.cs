using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Reviews.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Commands;

public sealed record CreateReviewCommand(string UserId, ReviewScheduleUpsertRequest Request) : IRequest<ApiResponse<ReviewScheduleDto>>;

public sealed class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, ApiResponse<ReviewScheduleDto>>
{
    private readonly IAppDbContext _db;

    public CreateReviewCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ReviewScheduleDto>> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.LessonProgressId) && string.IsNullOrWhiteSpace(request.Request.LessonId))
        {
            throw new ValidationAppException("LessonProgressId or LessonId is required.");
        }

        Domain.Entities.LessonProgress? progress = null;
        if (!string.IsNullOrWhiteSpace(request.Request.LessonProgressId))
        {
            progress = await _db.LessonProgresses.FirstOrDefaultAsync(
                x => x.Id == request.Request.LessonProgressId &&
                     x.UserId == request.UserId &&
                     !x.IsDeleted,
                cancellationToken);
        }

        if (progress is null && !string.IsNullOrWhiteSpace(request.Request.LessonId))
        {
            progress = await _db.LessonProgresses.FirstOrDefaultAsync(
                x => x.LessonId == request.Request.LessonId &&
                     x.UserId == request.UserId &&
                     !x.IsDeleted,
                cancellationToken);
        }

        if (progress is null)
        {
            throw new NotFoundAppException("Lesson progress not found.");
        }

        var now = DateTime.UtcNow;
        var requestedReviewId = string.IsNullOrWhiteSpace(request.Request.Id)
            ? Guid.NewGuid().ToString("D")
            : request.Request.Id!;

        var entity = await _db.ReviewSchedules.FirstOrDefaultAsync(
            x => x.Id == requestedReviewId && x.UserId == request.UserId,
            cancellationToken);

        if (entity is null)
        {
            // Idempotency for offline sync: if the same round already exists on server under
            // a different id, update that row instead of inserting a duplicate.
            entity = await _db.ReviewSchedules.FirstOrDefaultAsync(
                x => x.UserId == request.UserId &&
                     x.LessonProgressId == progress.Id &&
                     x.ReviewRound == request.Request.ReviewRound &&
                     !x.IsDeleted,
                cancellationToken);
        }

        if (entity is null)
        {
            entity = new ReviewSchedule
            {
                Id = requestedReviewId,
                UserId = request.UserId,
                LessonProgressId = progress.Id,
                CreatedAt = request.Request.CreatedAt ?? now,
            };
            await _db.ReviewSchedules.AddAsync(entity, cancellationToken);
        }

        entity.LessonProgressId = progress.Id;
        entity.ReviewRound = request.Request.ReviewRound;
        entity.DueDate = request.Request.DueDate;
        entity.Completed = request.Request.Completed;
        entity.CompletedDate = request.Request.CompletedDate;
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Handle race conditions where another request inserted the same unique key
            // (UserId + LessonProgressId + ReviewRound) between read and write.
            var existingByRound = await _db.ReviewSchedules.FirstOrDefaultAsync(
                x => x.UserId == request.UserId &&
                     x.LessonProgressId == progress.Id &&
                     x.ReviewRound == request.Request.ReviewRound &&
                     !x.IsDeleted,
                cancellationToken);

            if (existingByRound is null)
            {
                throw;
            }

            return ApiResponse<ReviewScheduleDto>.Ok(existingByRound.Adapt<ReviewScheduleDto>());
        }

        return ApiResponse<ReviewScheduleDto>.Ok(entity.Adapt<ReviewScheduleDto>());
    }
}
