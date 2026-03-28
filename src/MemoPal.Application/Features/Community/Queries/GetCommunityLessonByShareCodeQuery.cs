using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Community.DTOs;
using MemoPal.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Community.Queries;

public sealed record GetCommunityLessonByShareCodeQuery(
    string UserId,
    string ShareCode) : IRequest<ApiResponse<CommunityLessonDto>>;

public sealed class GetCommunityLessonByShareCodeQueryHandler
    : IRequestHandler<GetCommunityLessonByShareCodeQuery, ApiResponse<CommunityLessonDto>>
{
    private readonly IAppDbContext _db;

    public GetCommunityLessonByShareCodeQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<CommunityLessonDto>> Handle(
        GetCommunityLessonByShareCodeQuery request,
        CancellationToken cancellationToken)
    {
        var normalizedCode = CommunityLessonHelpers.NormalizeShareCode(request.ShareCode);
        if (string.IsNullOrWhiteSpace(normalizedCode))
        {
            throw new ValidationAppException("Share code is required.");
        }

        var lessonRow = await (
            from lesson in _db.Lessons.AsNoTracking()
            where !lesson.IsDeleted &&
                  lesson.IsCustom == true &&
                  lesson.Privacy == "public" &&
                  !string.IsNullOrWhiteSpace(lesson.CreatedBy) &&
                  EF.Functions.Like(
                      lesson.Id.Replace("-", string.Empty).ToUpper(),
                      normalizedCode + "%")
            join creator in _db.Users.AsNoTracking().Where(x => !x.IsDeleted)
                on lesson.CreatedBy equals creator.Id into creatorJoin
            from creator in creatorJoin.DefaultIfEmpty()
            orderby lesson.UpdatedAt descending
            select new
            {
                Lesson = lesson,
                CreatorId = creator != null ? creator.Id : null,
                CreatorName = creator != null ? creator.DisplayName : null,
                CreatorAvatarUrl = creator != null ? creator.AvatarUrl : null,
                CreatorRole = creator != null ? creator.Role : null
            }
        ).FirstOrDefaultAsync(cancellationToken);

        if (lessonRow is null)
        {
            throw new NotFoundAppException("Community lesson not found for this share code.");
        }

        var words = await (
            from word in _db.Words.AsNoTracking()
            where word.LessonId == lessonRow.Lesson.Id && !word.IsDeleted
            join location in _db.Locations.AsNoTracking().Where(x => !x.IsDeleted)
                on word.LocationId equals location.Id into locationJoin
            from location in locationJoin.DefaultIfEmpty()
            orderby (location == null ? int.MaxValue : location.Position), word.CreatedAt
            select new CommunityWordDto(word.Text, word.Meaning)
        ).ToListAsync(cancellationToken);

        var lessonEntity = lessonRow.Lesson;
        var creatorId = lessonRow.CreatorId ?? lessonEntity.CreatedBy ?? string.Empty;
        var dto = new CommunityLessonDto(
            Id: lessonEntity.Id,
            Title: lessonEntity.Title,
            Description: lessonEntity.Description ?? string.Empty,
            Words: words,
            Category: lessonEntity.Category ?? "general",
            Tags: CommunityLessonHelpers.ParseTags(lessonEntity.TagJson),
            Creator: new CommunityCreatorDto(
                Id: creatorId,
                Name: lessonRow.CreatorName ?? "Unknown Creator",
                IsVerified: lessonRow.CreatorRole == UserRoles.Admin,
                AvatarUrl: lessonRow.CreatorAvatarUrl),
            Stats: new CommunityLessonStatsDto(
                UsageCount: 0,
                Rating: 0,
                ReviewCount: 0,
                CreatedAt: lessonEntity.CreatedAt,
                UpdatedAt: lessonEntity.UpdatedAt),
            ShareCode: CommunityLessonHelpers.BuildShareCode(lessonEntity.Id),
            IsPublic: true,
            IsPremium: lessonEntity.IsPremium ?? false);

        return ApiResponse<CommunityLessonDto>.Ok(dto);
    }
}
