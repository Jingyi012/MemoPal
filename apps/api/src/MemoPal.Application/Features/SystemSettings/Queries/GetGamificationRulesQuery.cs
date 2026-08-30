using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.SystemSettings.DTOs;

namespace MemoPal.Application.Features.SystemSettings.Queries;

public sealed record GetGamificationRulesQuery : IRequest<ApiResponse<GamificationRulesDto>>;

public sealed class GetGamificationRulesQueryHandler
    : IRequestHandler<GetGamificationRulesQuery, ApiResponse<GamificationRulesDto>>
{
    private readonly IAppDbContext _db;

    public GetGamificationRulesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<GamificationRulesDto>> Handle(
        GetGamificationRulesQuery request,
        CancellationToken cancellationToken)
    {
        var xp = await _db.GetXpAwardConfigAsync(cancellationToken);
        var xpPerLevel = await _db.GetXpPerLevelAsync(cancellationToken);
        return ApiResponse<GamificationRulesDto>.Ok(new GamificationRulesDto(
            xp.MemoryLearnedXp,
            xp.DueReviewXp,
            xp.ExtraPracticeXp,
            xp.ExtraPracticeDailyLimit,
            xpPerLevel));
    }
}
