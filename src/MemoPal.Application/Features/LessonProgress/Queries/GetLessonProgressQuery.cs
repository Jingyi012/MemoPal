using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.LessonProgress.Queries;

public sealed record GetLessonProgressQuery(string UserId, string LessonId) : IRequest<ApiResponse<LessonProgressDto>>;

public sealed class GetLessonProgressQueryHandler : IRequestHandler<GetLessonProgressQuery, ApiResponse<LessonProgressDto>>
{
    private readonly IAppDbContext _db;

    public GetLessonProgressQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<LessonProgressDto>> Handle(GetLessonProgressQuery request, CancellationToken cancellationToken)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == request.LessonId &&
                 !x.IsDeleted &&
                 (x.IsCustom != true || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Lesson not found.");

        var progress = await _db.LessonProgresses.FirstOrDefaultAsync(
            x => x.UserId == request.UserId && x.LessonId == request.LessonId && !x.IsDeleted,
            cancellationToken) ?? throw new NotFoundAppException("Lesson progress not found.");

        var schedules = await _db.ReviewSchedules
            .Where(x => x.UserId == request.UserId && x.LessonProgressId == progress.Id && !x.IsDeleted)
            .OrderBy(x => x.ReviewRound)
            .ToListAsync(cancellationToken);

        var reviewDtos = schedules.Select(x => x.Adapt<ReviewScheduleDto>()).ToList();
        return ApiResponse<LessonProgressDto>.Ok((progress, (IReadOnlyList<ReviewScheduleDto>)reviewDtos).Adapt<LessonProgressDto>());
    }
}




