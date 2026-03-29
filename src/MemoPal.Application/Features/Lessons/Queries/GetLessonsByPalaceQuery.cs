using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
using MemoPal.Domain.Common;
using MemoPal.Application.Features.Lessons.DTOs;
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
            return ApiResponse<IReadOnlyList<LessonDto>>.Ok(lessons.Select(x => x.Adapt<LessonDto>()).ToList());
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);
        var paged = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return PaginatedResponse<LessonDto>.Ok(paged.Select(x => x.Adapt<LessonDto>()).ToList(), pageNumber, pageSize, totalCount);
    }
}
