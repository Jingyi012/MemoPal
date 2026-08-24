using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Missions.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Missions.Queries;

public sealed record GetMissionTemplatesQuery() : IRequest<ApiResponse<IReadOnlyList<MissionTemplateDto>>>;

public sealed class GetMissionTemplatesQueryHandler
    : IRequestHandler<GetMissionTemplatesQuery, ApiResponse<IReadOnlyList<MissionTemplateDto>>>
{
    private readonly IAppDbContext _db;

    public GetMissionTemplatesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<MissionTemplateDto>>> Handle(GetMissionTemplatesQuery request, CancellationToken cancellationToken)
    {
        var templates = await _db.MissionTemplates
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Key)
            .Select(x => new MissionTemplateDto
            {
                Key = x.Key,
                Title = x.Title,
                Description = x.Description,
                MetricType = x.MetricType,
                Period = x.Period,
                TargetValue = x.TargetValue,
                RewardXp = x.RewardXp,
                SortOrder = x.SortOrder,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        if (templates.Count == 0)
        {
            templates = MissionTemplateSerializer.GetDefaultTemplates().ToList();
        }

        return ApiResponse<IReadOnlyList<MissionTemplateDto>>.Ok(templates);
    }
}

