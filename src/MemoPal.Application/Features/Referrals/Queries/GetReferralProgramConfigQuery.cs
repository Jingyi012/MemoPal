using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Referrals.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Referrals.Queries;

public sealed record GetReferralProgramConfigQuery() : IRequest<ApiResponse<ReferralProgramConfigDto>>;

public sealed class GetReferralProgramConfigQueryHandler
    : IRequestHandler<GetReferralProgramConfigQuery, ApiResponse<ReferralProgramConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetReferralProgramConfigQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ReferralProgramConfigDto>> Handle(GetReferralProgramConfigQuery request, CancellationToken cancellationToken)
    {
        var setting = await _db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.GrowthReferralProgramConfig,
                cancellationToken);

        var config = ReferralProgramConfigSerializer.ParseOrDefault(setting?.Value);
        return ApiResponse<ReferralProgramConfigDto>.Ok(config);
    }
}
