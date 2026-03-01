using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Reviews.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Commands;

public sealed record CompleteReviewCommand(string UserId, string ReviewId, int? CorrectCount, int? TotalCount) : IRequest<ReviewScheduleDto>;

public sealed class CompleteReviewCommandHandler : IRequestHandler<CompleteReviewCommand, ReviewScheduleDto>
{
    private static readonly int[] ReviewIntervalsDays = [1, 3, 7, 30];
    private const double PassThreshold = 0.7d;

    private readonly IAppDbContext _db;

    public CompleteReviewCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ReviewScheduleDto> Handle(CompleteReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _db.ReviewSchedules.FirstOrDefaultAsync(
                x => x.Id == request.ReviewId && x.UserId == request.UserId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Review schedule not found.");

        if (review.Completed)
        {
            return review.Adapt<ReviewScheduleDto>();
        }

        var now = DateTime.UtcNow;
        review.Completed = true;
        review.CompletedDate = now;
        review.UpdatedAt = now;

        var progress = await _db.LessonProgresses.FirstOrDefaultAsync(
                x => x.Id == review.LessonProgressId && x.UserId == request.UserId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Lesson progress not found.");

        var accuracy = request.TotalCount.GetValueOrDefault() <= 0
            ? 1d
            : (double)request.CorrectCount.GetValueOrDefault() / request.TotalCount.GetValueOrDefault();
        var passed = accuracy >= PassThreshold;

        progress.TotalReviews += passed ? 1 : 0;
        progress.LastReviewDate = now;
        progress.MasteryLevel = passed && review.ReviewRound >= ReviewIntervalsDays.Length ? "mastered" : "reviewing";
        progress.UpdatedAt = now;

        if (passed && review.ReviewRound < ReviewIntervalsDays.Length)
        {
            var nextRound = review.ReviewRound + 1;
            var existing = await _db.ReviewSchedules.FirstOrDefaultAsync(
                x => x.UserId == request.UserId &&
                     x.LessonProgressId == review.LessonProgressId &&
                     x.ReviewRound == nextRound &&
                     !x.IsDeleted,
                cancellationToken);

            if (existing is null)
            {
                var next = new ReviewSchedule
                {
                    Id = Guid.NewGuid().ToString("D"),
                    UserId = request.UserId,
                    LessonProgressId = review.LessonProgressId,
                    ReviewRound = nextRound,
                    DueDate = now.AddDays(ReviewIntervalsDays[nextRound - 1]),
                    Completed = false,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                await _db.ReviewSchedules.AddAsync(next, cancellationToken);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return review.Adapt<ReviewScheduleDto>();
    }
}
