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
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Key)
            .Select(x => new SystemSettingDto(x.Id, x.Key, x.Value, x.Description, x.CreatedAt, x.UpdatedAt))
            .ToListAsync(cancellationToken);

        return ApiResponse<List<SystemSettingDto>>.Ok(settings);
    }
}

/// <summary>
/// Get a single system setting by key
/// </summary>
public sealed record GetSystemSettingsByKeyQuery(string Key) : IRequest<ApiResponse<SystemSettingDto>>;

public sealed class GetSystemSettingsByKeyQueryHandler
    : IRequestHandler<GetSystemSettingsByKeyQuery, ApiResponse<SystemSettingDto>>
{
    private readonly IAppDbContext _db;

    public GetSystemSettingsByKeyQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SystemSettingDto>> Handle(GetSystemSettingsByKeyQuery request, CancellationToken cancellationToken)
    {
        var setting = await _db.SystemSettings
            .AsNoTracking()
            .Where(x => x.Key == request.Key && !x.IsDeleted)
            .Select(x => new SystemSettingDto(x.Id, x.Key, x.Value, x.Description, x.CreatedAt, x.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        if (setting is null)
            return ApiResponse<SystemSettingDto>.Fail($"Setting with key '{request.Key}' not found.");

        return ApiResponse<SystemSettingDto>.Ok(setting);
    }
}

/// <summary>
/// Get system settings by key pattern (e.g., "limits.*")
/// </summary>
public sealed record GetSystemSettingsByPatternQuery(string Pattern) : IRequest<ApiResponse<List<SystemSettingDto>>>;

public sealed class GetSystemSettingsByPatternQueryHandler
    : IRequestHandler<GetSystemSettingsByPatternQuery, ApiResponse<List<SystemSettingDto>>>
{
    private readonly IAppDbContext _db;

    public GetSystemSettingsByPatternQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<List<SystemSettingDto>>> Handle(GetSystemSettingsByPatternQuery request, CancellationToken cancellationToken)
    {
        // Convert pattern to regex: "limits.*" -> "^limits\..*$"
        var pattern = "^" + request.Pattern.Replace(".", @"\.").Replace("*", ".*") + "$";

        var allSettings = await _db.SystemSettings
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .ToListAsync(cancellationToken);

        var filtered = allSettings
            .Where(x => System.Text.RegularExpressions.Regex.IsMatch(x.Key, pattern))
            .OrderBy(x => x.Key)
            .Select(x => new SystemSettingDto(x.Id, x.Key, x.Value, x.Description, x.CreatedAt, x.UpdatedAt))
            .ToList();

        return ApiResponse<List<SystemSettingDto>>.Ok(filtered);
    }
}
