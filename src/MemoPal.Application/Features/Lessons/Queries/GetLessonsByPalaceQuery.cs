using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
using MemoPal.Domain.Common;
using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.Lessons.DTOs;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Lessons.Queries;

public sealed record GetLessonsByPalaceQuery(
    string UserId,
    string PalaceId,
    int? PageNumber = null,
    int? PageSize = null,
    bool IsAdmin = false,
    bool AdminCreatedOnly = false) : IRequest<ApiResponse<IReadOnlyList<LessonDto>>>;

public sealed class GetLessonsByPalaceQueryHandler : IRequestHandler<GetLessonsByPalaceQuery, ApiResponse<IReadOnlyList<LessonDto>>>
{
    private readonly IAppDbContext _db;

    public GetLessonsByPalaceQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LessonDto>>> Handle(GetLessonsByPalaceQuery request, CancellationToken cancellationToken)
    {
        var palace = await PalaceAccessPolicy.FindAccessiblePalaceAsync(
            _db,
            request.PalaceId,
            request.UserId,
            request.IsAdmin,
            cancellationToken);
        if (palace is null) throw new NotFoundAppException("Palace not found.");

        if (request.IsAdmin && request.AdminCreatedOnly)
        {
            var isLegacyOfficial = string.IsNullOrWhiteSpace(palace.CreatedBy) && !palace.IsCustom;
            var isAdminCreatedPalace = !string.IsNullOrWhiteSpace(palace.CreatedBy) && await _db.Users
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == palace.CreatedBy &&
                         x.Role == UserRoles.Admin &&
                         !x.IsDeleted,
                    cancellationToken);

            if (!isLegacyOfficial && !isAdminCreatedPalace)
            {
                throw new NotFoundAppException("Palace not found.");
            }
        }

        var query = _db.Lessons
            .Where(x => x.PalaceId == request.PalaceId && !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .AsQueryable();

        if (request.IsAdmin && request.AdminCreatedOnly)
        {
            var adminUserIds = _db.Users
                .AsNoTracking()
                .Where(x => x.Role == UserRoles.Admin && !x.IsDeleted)
                .Select(x => x.Id);

            query = query.Where(x =>
                (x.CreatedBy != null && adminUserIds.Contains(x.CreatedBy)) ||
                ((x.CreatedBy == null || x.CreatedBy == string.Empty) && x.IsCustom != true));
        }

        var usePagination = request.PageNumber.HasValue && request.PageSize.HasValue;
        if (!usePagination)
        {
            var lessons = await query.ToListAsync(cancellationToken);
            var lessonDtos = await BuildLessonDtosAsync(request.UserId, lessons, cancellationToken);
            return ApiResponse<IReadOnlyList<LessonDto>>.Ok(lessonDtos);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);
        var paged = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        var pagedDtos = await BuildLessonDtosAsync(request.UserId, paged, cancellationToken);
        return PaginatedResponse<LessonDto>.Ok(pagedDtos, pageNumber, pageSize, totalCount);
    }

    private async Task<IReadOnlyList<LessonDto>> BuildLessonDtosAsync(
        string userId,
        IReadOnlyList<MemoPal.Domain.Entities.Lesson> lessons,
        CancellationToken cancellationToken)
    {
        if (lessons.Count == 0)
        {
            return [];
        }

        var lessonIds = lessons
            .Where(x => x is not null && !string.IsNullOrWhiteSpace(x.Id))
            .Select(x => x.Id)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (lessonIds.Count == 0)
        {
            return lessons
                .Where(x => x is not null)
                .Select(x => x.Adapt<LessonDto>() with { Progress = null, Words = null })
                .ToList();
        }

        var progresses = await _db.LessonProgresses
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                !string.IsNullOrWhiteSpace(x.LessonId) &&
                lessonIds.Contains(x.LessonId) &&
                !x.IsDeleted)
            .ToListAsync(cancellationToken);

        var progressByLessonId = progresses
            .Where(x => !string.IsNullOrWhiteSpace(x.LessonId))
            .GroupBy(x => x.LessonId, StringComparer.Ordinal)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(item => item.UpdatedAt).First(),
                StringComparer.Ordinal);

        var progressIds = progressByLessonId.Values
            .Where(x => !string.IsNullOrWhiteSpace(x.Id))
            .Select(x => x.Id)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var schedules = progressIds.Count == 0
            ? []
            : await _db.ReviewSchedules
                .AsNoTracking()
                .Where(x =>
                    x.UserId == userId &&
                    !string.IsNullOrWhiteSpace(x.LessonProgressId) &&
                    progressIds.Contains(x.LessonProgressId) &&
                    !x.IsDeleted)
                .OrderBy(x => x.ReviewRound)
                .ToListAsync(cancellationToken);

        var reviewDtoByProgressId = schedules
            .Where(x => !string.IsNullOrWhiteSpace(x.LessonProgressId))
            .GroupBy(x => x.LessonProgressId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<ReviewScheduleDto>)group
                    .Select(item => item.Adapt<ReviewScheduleDto>())
                    .ToList(),
                StringComparer.Ordinal);

        return lessons
            .Where(lesson => lesson is not null)
            .Select(lesson =>
            {
                LessonProgressDto? progressDto = null;
                if (!string.IsNullOrWhiteSpace(lesson.Id) &&
                    progressByLessonId.TryGetValue(lesson.Id, out var progress))
                {
                    var schedulesForProgress = reviewDtoByProgressId.TryGetValue(progress.Id, out var reviewDtos)
                        ? reviewDtos
                        : [];
                    progressDto = (progress, schedulesForProgress).Adapt<LessonProgressDto>();
                }

                return lesson.Adapt<LessonDto>() with
                {
                    Progress = progressDto,
                    Words = null
                };
            })
            .ToList();
    }
}
