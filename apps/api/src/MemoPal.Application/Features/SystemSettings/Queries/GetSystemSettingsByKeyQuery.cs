using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.SystemSettings.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.SystemSettings.Queries;

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
        {
            return ApiResponse<SystemSettingDto>.Fail($"Setting with key '{request.Key}' not found.");
        }

        return ApiResponse<SystemSettingDto>.Ok(setting);
    }
}

