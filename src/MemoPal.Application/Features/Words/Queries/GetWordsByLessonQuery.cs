using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Words.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Queries;

public sealed record GetWordsByLessonQuery(string UserId, string LessonId, int? PageNumber = null, int? PageSize = null) : IRequest<ApiResponse<IReadOnlyList<WordDto>>>;

public sealed class GetWordsByLessonQueryHandler : IRequestHandler<GetWordsByLessonQuery, ApiResponse<IReadOnlyList<WordDto>>>
{
    private readonly IAppDbContext _db;

    public GetWordsByLessonQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<WordDto>>> Handle(GetWordsByLessonQuery request, CancellationToken cancellationToken)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == request.LessonId &&
                 !x.IsDeleted &&
                 (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Lesson not found.");

        var query = _db.Words
            .Where(x => x.LessonId == request.LessonId && !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .AsQueryable();

        var usePagination = request.PageNumber.HasValue && request.PageSize.HasValue;
        if (!usePagination)
        {
            var words = await query.ToListAsync(cancellationToken);
            return ApiResponse<IReadOnlyList<WordDto>>.Ok(words.Select(x => x.Adapt<WordDto>()).ToList());
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);
        var paged = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return PaginatedResponse<WordDto>.Ok(paged.Select(x => x.Adapt<WordDto>()).ToList(), pageNumber, pageSize, totalCount);
    }
}

