using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Referrals.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Referrals.Commands;

public sealed record UpsertReferralProgramConfigCommand(UpsertReferralProgramConfigRequest Request)
    : IRequest<ApiResponse<ReferralProgramConfigDto>>;

public sealed class UpsertReferralProgramConfigCommandHandler
    : IRequestHandler<UpsertReferralProgramConfigCommand, ApiResponse<ReferralProgramConfigDto>>
{
    private readonly IAppDbContext _db;

    public UpsertReferralProgramConfigCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ReferralProgramConfigDto>> Handle(UpsertReferralProgramConfigCommand request, CancellationToken cancellationToken)
    {
        var normalized = ReferralProgramConfigSerializer.Normalize(request.Request.Config ?? new ReferralProgramConfigDto());
        var serialized = ReferralProgramConfigSerializer.Serialize(normalized);

        var setting = await _db.SystemSettings
            .FirstOrDefaultAsync(x => x.Key == SystemSettingKeys.GrowthReferralProgramConfig, cancellationToken);

        var now = DateTime.UtcNow;
        if (setting is null)
        {
            setting = new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = SystemSettingKeys.GrowthReferralProgramConfig,
                Value = serialized,
                Description = "Referral reward program configuration.",
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };
            _db.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = serialized;
            setting.Description = "Referral reward program configuration.";
            setting.UpdatedAt = now;
            setting.IsDeleted = false;
            setting.DeletedAt = null;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<ReferralProgramConfigDto>.Ok(normalized);
    }
}
