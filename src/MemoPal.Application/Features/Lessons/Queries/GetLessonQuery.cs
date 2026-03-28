using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.Lessons.DTOs;
using MemoPal.Application.Features.Reviews.DTOs;
using MemoPal.Application.Features.Words.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Lessons.Queries;

public sealed record GetLessonQuery(string UserId, string LessonId, bool IsAdmin = false) : IRequest<ApiResponse<LessonDto>>;

public sealed class GetLessonQueryHandler : IRequestHandler<GetLessonQuery, ApiResponse<LessonDto>>
{
    private readonly IAppDbContext _db;

    public GetLessonQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<LessonDto>> Handle(GetLessonQuery request, CancellationToken cancellationToken)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
                x => x.Id == request.LessonId &&
                     !x.IsDeleted &&
                     (request.IsAdmin || x.IsCustom != true || x.CreatedBy == request.UserId),
                cancellationToken)
            ?? throw new NotFoundAppException("Lesson not found.");

        var progress = await _db.LessonProgresses.FirstOrDefaultAsync(
            x => x.UserId == request.UserId && x.LessonId == lesson.Id && !x.IsDeleted,
            cancellationToken);

        LessonProgressDto? progressDto = null;
        if (progress is not null)
        {
            var schedules = await _db.ReviewSchedules
                .Where(x => x.UserId == request.UserId && x.LessonProgressId == progress.Id && !x.IsDeleted)
                .OrderBy(x => x.ReviewRound)
                .ToListAsync(cancellationToken);

            var reviewDtos = schedules.Select(x => x.Adapt<ReviewScheduleDto>()).ToList();
            progressDto = (progress, (IReadOnlyList<ReviewScheduleDto>)reviewDtos).Adapt<LessonProgressDto>();
        }

        var words = await (
            from word in _db.Words
            where word.LessonId == lesson.Id && !word.IsDeleted
            join location in _db.Locations.Where(x => !x.IsDeleted)
                on word.LocationId equals location.Id into locationJoin
            from location in locationJoin.DefaultIfEmpty()
            orderby (location == null ? int.MaxValue : location.Position), word.CreatedAt
            select word
        ).ToListAsync(cancellationToken);
        var wordDtos = words.Select(x => x.Adapt<WordDto>()).ToList();

        var lessonDto = lesson.Adapt<LessonDto>() with
        {
            Progress = progressDto,
            Words = wordDtos
        };

        return ApiResponse<LessonDto>.Ok(lessonDto);
    }
}




