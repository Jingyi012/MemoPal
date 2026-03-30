using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Community.DTOs;
using MemoPal.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Community.Queries;

public sealed record GetCommunityLessonsQuery(
    string UserId,
    string? Search = null,
    string? Category = null,
    int PageNumber = 1,
    int PageSize = 20,
    bool MineOnly = false) : IRequest<PaginatedResponse<CommunityLessonDto>>;

public sealed class GetCommunityLessonsQueryHandler
    : IRequestHandler<GetCommunityLessonsQuery, PaginatedResponse<CommunityLessonDto>>
{
    private readonly IAppDbContext _db;

    public GetCommunityLessonsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<CommunityLessonDto>> Handle(
        GetCommunityLessonsQuery request,
        CancellationToken cancellationToken)
    {
        var normalizedSearch = string.IsNullOrWhiteSpace(request.Search) ? null : request.Search.Trim().ToLowerInvariant();
        var normalizedCategory = string.IsNullOrWhiteSpace(request.Category) || request.Category == "all"
            ? null
            : request.Category.Trim().ToLowerInvariant();

        var query = _db.Lessons
            .AsNoTracking()
            .Where(x =>
                !x.IsDeleted &&
                x.IsCustom == true &&
                x.Privacy == "public" &&
                !string.IsNullOrWhiteSpace(x.CreatedBy));

        if (request.MineOnly)
        {
            query = query.Where(x => x.CreatedBy == request.UserId);
        }

        if (!string.IsNullOrWhiteSpace(normalizedCategory))
        {
            query = query.Where(x => x.Category == normalizedCategory);
        }

        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            query = query.Where(x =>
                x.Title.ToLower().Contains(normalizedSearch) ||
                (x.Description != null && x.Description.ToLower().Contains(normalizedSearch)) ||
                (x.TagJson != null && x.TagJson.ToLower().Contains(normalizedSearch)));
        }

        var orderedQuery = query.OrderByDescending(x => x.UpdatedAt);

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var totalCount = await orderedQuery.CountAsync(cancellationToken);

        var pagedLessonsQuery = orderedQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize);

        var lessonRows = await (
            from lesson in pagedLessonsQuery
            join creator in _db.Users.AsNoTracking().Where(x => !x.IsDeleted)
                on lesson.CreatedBy equals creator.Id into creatorJoin
            from creator in creatorJoin.DefaultIfEmpty()
            select new
            {
                Lesson = lesson,
                CreatorId = creator != null ? creator.Id : null,
                CreatorName = creator != null ? creator.DisplayName : null,
                CreatorAvatarUrl = creator != null ? creator.AvatarUrl : null,
                CreatorRole = creator != null ? creator.Role : null
            }
        ).ToListAsync(cancellationToken);

        var lessonIds = lessonRows.Select(x => x.Lesson.Id).ToList();

        var wordRows = lessonIds.Count == 0
            ? []
            : await (
                from word in _db.Words.AsNoTracking()
                where lessonIds.Contains(word.LessonId) && !word.IsDeleted
                join location in _db.Locations.AsNoTracking().Where(x => !x.IsDeleted)
                    on word.LocationId equals location.Id into locationJoin
                from location in locationJoin.DefaultIfEmpty()
                orderby word.LessonId, (location == null ? int.MaxValue : location.Position), word.CreatedAt
                select new
                {
                    word.LessonId,
                    word.Text,
                    word.Meaning
                }
            ).ToListAsync(cancellationToken);

        var wordsByLesson = wordRows
            .GroupBy(x => x.LessonId, StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<CommunityWordDto>)g
                    .Select(x => new CommunityWordDto(x.Text, x.Meaning))
                    .ToList(),
                StringComparer.Ordinal);

        var items = lessonRows.Select(row =>
        {
            var lesson = row.Lesson;
            var creatorId = row.CreatorId ?? lesson.CreatedBy ?? string.Empty;

            return new CommunityLessonDto(
                Id: lesson.Id,
                Title: lesson.Title,
                Description: lesson.Description ?? string.Empty,
                Words: wordsByLesson.TryGetValue(lesson.Id, out var words) ? words : [],
                Category: lesson.Category ?? "general",
                Tags: CommunityLessonHelpers.ParseTags(lesson.TagJson),
                Creator: new CommunityCreatorDto(
                    Id: creatorId,
                    Name: row.CreatorName ?? "Unknown Creator",
                    IsVerified: row.CreatorRole == UserRoles.Admin,
                    AvatarUrl: row.CreatorAvatarUrl),
                Stats: new CommunityLessonStatsDto(
                    UsageCount: 0,
                    Rating: 0,
                    ReviewCount: 0,
                    CreatedAt: lesson.CreatedAt,
                    UpdatedAt: lesson.UpdatedAt),
                ShareCode: CommunityLessonHelpers.BuildShareCode(lesson.Id),
                IsPublic: true,
                IsPremium: lesson.IsPremium ?? false);
        }).ToList().Adapt<List<CommunityLessonDto>>();

        return PaginatedResponse<CommunityLessonDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
