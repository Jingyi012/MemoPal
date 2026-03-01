using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Words.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Queries;

public sealed record GetUpdatedWordsQuery(string UserId, DateTime Since) : IRequest<IReadOnlyList<WordDto>>;

public sealed class GetUpdatedWordsQueryHandler : IRequestHandler<GetUpdatedWordsQuery, IReadOnlyList<WordDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedWordsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<WordDto>> Handle(GetUpdatedWordsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.Words
            .Where(x => x.UpdatedAt > request.Since)
            .Join(_db.Lessons, word => word.LessonId, lesson => lesson.Id, (word, lesson) => new { word, lesson })
            .Where(x => !x.lesson.IsCustom.GetValueOrDefault() || x.lesson.CreatedBy == request.UserId)
            .OrderBy(x => x.word.UpdatedAt)
            .Select(x => x.word)
            .ToListAsync(cancellationToken);

        return data.Select(x => x.Adapt<WordDto>()).ToList();
    }
}

