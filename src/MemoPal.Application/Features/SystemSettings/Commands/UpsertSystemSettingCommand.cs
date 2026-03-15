using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.SystemSettings.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.SystemSettings.Commands;

public sealed record UpsertSystemSettingCommand(UpsertSystemSettingRequest Request)
    : IRequest<ApiResponse<SystemSettingDto>>;

public sealed class UpsertSystemSettingCommandHandler
    : IRequestHandler<UpsertSystemSettingCommand, ApiResponse<SystemSettingDto>>
{
    private readonly IAppDbContext _db;

    public UpsertSystemSettingCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SystemSettingDto>> Handle(UpsertSystemSettingCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Key))
            return ApiResponse<SystemSettingDto>.Fail("Key is required.");

        var key = request.Request.Key.Trim();
        var entity = await _db.SystemSettings.FirstOrDefaultAsync(x => x.Key == key, cancellationToken);

        if (entity is null)
        {
            entity = new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = key,
                Value = request.Request.Value ?? string.Empty,
                Description = request.Request.Description,
            };
            _db.SystemSettings.Add(entity);
        }
        else
        {
            entity.Value = request.Request.Value ?? string.Empty;
            entity.Description = request.Request.Description;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<SystemSettingDto>.Ok(new SystemSettingDto(
            entity.Id,
            entity.Key,
            entity.Value,
            entity.Description,
            entity.CreatedAt,
            entity.UpdatedAt
        ));
    }
}
