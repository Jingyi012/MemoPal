using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Application.Features.Words.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Queries;

public sealed record GetWordQuery(
    string UserId,
    string WordId,
    bool IsAdmin = false,
    bool AdminCreatedOnly = false) : IRequest<ApiResponse<WordDto>>;

public sealed class GetWordQueryHandler : IRequestHandler<GetWordQuery, ApiResponse<WordDto>>
{
    private readonly IAppDbContext _db;

    public GetWordQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<WordDto>> Handle(GetWordQuery request, CancellationToken cancellationToken)
    {
        var word = await _db.Words.FirstOrDefaultAsync(x => x.Id == request.WordId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Word not found.");
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == word.LessonId &&
                 !x.IsDeleted &&
                 (request.IsAdmin || x.IsCustom != true || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Word not found.");

        if (request.IsAdmin && request.AdminCreatedOnly)
        {
            var isLegacyOfficialLesson = string.IsNullOrWhiteSpace(lesson.CreatedBy) && lesson.IsCustom != true;
            var isAdminCreatedLesson = !string.IsNullOrWhiteSpace(lesson.CreatedBy) && await _db.Users
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == lesson.CreatedBy &&
                         x.Role == UserRoles.Admin &&
                         !x.IsDeleted,
                    cancellationToken);

            var isLegacyWord = string.IsNullOrWhiteSpace(word.CreatedBy);
            var isAdminCreatedWord = !string.IsNullOrWhiteSpace(word.CreatedBy) && await _db.Users
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == word.CreatedBy &&
                         x.Role == UserRoles.Admin &&
                         !x.IsDeleted,
                    cancellationToken);

            if ((!isLegacyOfficialLesson && !isAdminCreatedLesson) || (!isLegacyWord && !isAdminCreatedWord))
            {
                throw new NotFoundAppException("Word not found.");
            }
        }

        return ApiResponse<WordDto>.Ok(word.Adapt<WordDto>());
    }
}




