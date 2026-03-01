using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Words.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Queries;

public sealed record GetWordsByLessonQuery(string UserId, string LessonId) : IRequest<IReadOnlyList<WordDto>>;

public sealed class GetWordsByLessonQueryHandler : IRequestHandler<GetWordsByLessonQuery, IReadOnlyList<WordDto>>
{
    private readonly IAppDbContext _db;

    public GetWordsByLessonQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<WordDto>> Handle(GetWordsByLessonQuery request, CancellationToken cancellationToken)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == request.LessonId &&
                 !x.IsDeleted &&
                 (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Lesson not found.");

        var words = await _db.Words
            .Where(x => x.LessonId == request.LessonId && !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return words.Select(x => x.Adapt<WordDto>()).ToList();
    }
}

