using System.Text.RegularExpressions;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.SystemSettings.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.SystemSettings.Queries;

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
            .Where(x => Regex.IsMatch(x.Key, pattern))
            .OrderBy(x => x.Key)
            .Select(x => new SystemSettingDto(x.Id, x.Key, x.Value, x.Description, x.CreatedAt, x.UpdatedAt))
            .ToList();

        return ApiResponse<List<SystemSettingDto>>.Ok(filtered);
    }
}

