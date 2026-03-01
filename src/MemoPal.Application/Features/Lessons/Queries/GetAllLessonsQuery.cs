using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Lessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Lessons.Queries;

public sealed record GetAllLessonsQuery(string UserId) : IRequest<IReadOnlyList<LessonDto>>;

public sealed class GetAllLessonsQueryHandler : IRequestHandler<GetAllLessonsQuery, IReadOnlyList<LessonDto>>
{
    private readonly IAppDbContext _db;

    public GetAllLessonsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LessonDto>> Handle(GetAllLessonsQuery request, CancellationToken cancellationToken)
    {
        var lessons = await _db.Lessons
            .Where(x => !x.IsDeleted && (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId))
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return lessons.Select(x => x.Adapt<LessonDto>()).ToList();
    }
}

