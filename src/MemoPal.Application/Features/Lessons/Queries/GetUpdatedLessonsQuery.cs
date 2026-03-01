using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Lessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Lessons.Queries;

public sealed record GetUpdatedLessonsQuery(string UserId, DateTime Since) : IRequest<IReadOnlyList<LessonDto>>;

public sealed class GetUpdatedLessonsQueryHandler : IRequestHandler<GetUpdatedLessonsQuery, IReadOnlyList<LessonDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedLessonsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LessonDto>> Handle(GetUpdatedLessonsQuery request, CancellationToken cancellationToken)
    {
        var lessons = await _db.Lessons
            .Where(x => x.UpdatedAt > request.Since && (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId))
            .OrderBy(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        return lessons.Select(x => x.Adapt<LessonDto>()).ToList();
    }
}

