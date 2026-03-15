using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Admin.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Admin.Queries;

public sealed record GetCustomContentModerationQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<AdminModerationItemDto>>;

public sealed class GetCustomContentModerationQueryHandler
    : IRequestHandler<GetCustomContentModerationQuery, PaginatedResponse<AdminModerationItemDto>>
{
    private readonly IAppDbContext _db;

    public GetCustomContentModerationQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<AdminModerationItemDto>> Handle(GetCustomContentModerationQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var palaces = await _db.Palaces.AsNoTracking()
            .Where(x => x.IsCustom)
            .Select(x => new AdminModerationItemDto(
                x.Id,
                "palace",
                x.Name,
                x.Description,
                x.IsLocked,
                x.IsDeleted,
                x.CreatedAt,
                x.CreatedBy
            ))
            .ToListAsync(cancellationToken);

        var lessons = await _db.Lessons.AsNoTracking()
            .Where(x => x.IsCustom == true)
            .Select(x => new AdminModerationItemDto(
                x.Id,
                "lesson",
                x.Title,
                x.Description,
                x.IsLocked ?? false,
                x.IsDeleted,
                x.CreatedAt,
                x.CreatedBy
            ))
            .ToListAsync(cancellationToken);

        var all = palaces.Concat(lessons)
            .OrderByDescending(x => x.CreatedAt)
            .ToList();

        var total = all.Count;
        var page = all.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        return PaginatedResponse<AdminModerationItemDto>.Ok(page, pageNumber, pageSize, total);
    }
}
