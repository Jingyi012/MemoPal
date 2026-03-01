using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Words.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Queries;

public sealed record GetWordQuery(string UserId, string WordId) : IRequest<WordDto>;

public sealed class GetWordQueryHandler : IRequestHandler<GetWordQuery, WordDto>
{
    private readonly IAppDbContext _db;

    public GetWordQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<WordDto> Handle(GetWordQuery request, CancellationToken cancellationToken)
    {
        var word = await _db.Words.FirstOrDefaultAsync(x => x.Id == request.WordId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Word not found.");
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == word.LessonId &&
                 !x.IsDeleted &&
                 (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Word not found.");
        return word.Adapt<WordDto>();
    }
}

