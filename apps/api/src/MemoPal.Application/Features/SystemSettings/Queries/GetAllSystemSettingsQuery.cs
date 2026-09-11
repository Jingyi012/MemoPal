using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.SystemSettings.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.SystemSettings.Queries;

/// <summary>
/// Get all system settings (for mobile app cache population)
/// </summary>
public sealed record GetAllSystemSettingsQuery : IRequest<ApiResponse<List<SystemSettingDto>>>;

public sealed class GetAllSystemSettingsQueryHandler
    : IRequestHandler<GetAllSystemSettingsQuery, ApiResponse<List<SystemSettingDto>>>
{
    private readonly IAppDbContext _db;

    public GetAllSystemSettingsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<List<SystemSettingDto>>> Handle(GetAllSystemSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _db.SystemSettings
            .AsNoTracking()
            .Where(x => !x.IsDeleted && !x.Key.StartsWith("ai."))
            .OrderBy(x => x.Key)
            .Select(x => new SystemSettingDto(x.Id, x.Key, x.Value, x.Description, x.CreatedAt, x.UpdatedAt))
            .ToListAsync(cancellationToken);

        return ApiResponse<List<SystemSettingDto>>.Ok(settings);
    }
}

