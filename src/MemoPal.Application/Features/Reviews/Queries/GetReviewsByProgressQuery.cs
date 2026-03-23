using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Queries;

public sealed record GetReviewsByProgressQuery(string UserId, string LessonProgressId) : IRequest<ApiResponse<IReadOnlyList<ReviewScheduleDto>>>;

public sealed class GetReviewsByProgressQueryHandler : IRequestHandler<GetReviewsByProgressQuery, ApiResponse<IReadOnlyList<ReviewScheduleDto>>>
{
    private readonly IAppDbContext _db;

    public GetReviewsByProgressQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<ReviewScheduleDto>>> Handle(GetReviewsByProgressQuery request, CancellationToken cancellationToken)
    {
        var progressExists = await _db.LessonProgresses.AnyAsync(
            x => x.Id == request.LessonProgressId && x.UserId == request.UserId && !x.IsDeleted,
            cancellationToken);
        if (!progressExists) throw new NotFoundAppException("Lesson progress not found.");

        var data = await _db.ReviewSchedules
            .Where(x => x.UserId == request.UserId && x.LessonProgressId == request.LessonProgressId && !x.IsDeleted)
            .OrderBy(x => x.ReviewRound)
            .ToListAsync(cancellationToken);
        var items = data.Select(x => x.Adapt<ReviewScheduleDto>()).ToList();
        return ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(items);
    }
}

