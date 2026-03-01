using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Lessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Lessons.Queries;

public sealed record GetLessonsByPalaceQuery(string UserId, string PalaceId) : IRequest<IReadOnlyList<LessonDto>>;

public sealed class GetLessonsByPalaceQueryHandler : IRequestHandler<GetLessonsByPalaceQuery, IReadOnlyList<LessonDto>>
{
    private readonly IAppDbContext _db;

    public GetLessonsByPalaceQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LessonDto>> Handle(GetLessonsByPalaceQuery request, CancellationToken cancellationToken)
    {
        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == request.PalaceId && !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);
        if (palace is null) throw new NotFoundAppException("Palace not found.");

        var lessons = await _db.Lessons
            .Where(x => x.PalaceId == request.PalaceId && !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return lessons.Select(x => x.Adapt<LessonDto>()).ToList();
    }
}

