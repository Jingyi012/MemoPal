using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.SystemSettings.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.SystemSettings.Queries;

public sealed record GetSystemSettingsQuery(int PageNumber = 1, int PageSize = 20, string? Search = null)
    : IRequest<PaginatedResponse<SystemSettingDto>>;

public sealed class GetSystemSettingsQueryHandler
    : IRequestHandler<GetSystemSettingsQuery, PaginatedResponse<SystemSettingDto>>
{
    private readonly IAppDbContext _db;

    public GetSystemSettingsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<SystemSettingDto>> Handle(GetSystemSettingsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var query = _db.SystemSettings.AsNoTracking().Where(x => !x.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x => x.Key.ToLower().Contains(s) || x.Value.ToLower().Contains(s));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.Key)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new SystemSettingDto(x.Id, x.Key, x.Value, x.Description, x.CreatedAt, x.UpdatedAt))
            .ToListAsync(cancellationToken);

        return PaginatedResponse<SystemSettingDto>.Ok(items, pageNumber, pageSize, total);
    }
}
