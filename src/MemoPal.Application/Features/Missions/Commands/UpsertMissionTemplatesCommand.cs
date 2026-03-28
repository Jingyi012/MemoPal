using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Missions.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Missions.Commands;

public sealed record UpsertMissionTemplatesCommand(UpsertMissionTemplatesRequest Request)
    : IRequest<ApiResponse<IReadOnlyList<MissionTemplateDto>>>;

public sealed class UpsertMissionTemplatesCommandHandler
    : IRequestHandler<UpsertMissionTemplatesCommand, ApiResponse<IReadOnlyList<MissionTemplateDto>>>
{
    private readonly IAppDbContext _db;

    public UpsertMissionTemplatesCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<MissionTemplateDto>>> Handle(UpsertMissionTemplatesCommand request, CancellationToken cancellationToken)
    {
        var templatesDto = request.Request.Templates ?? [];
        var now = DateTime.UtcNow;
        var keys = templatesDto.Select(t => t.Key).ToList();

        // Get existing templates by key
        var existing = await _db.MissionTemplates
            .AsTracking()
            .Where(x => keys.Contains(x.Key))
            .ToListAsync(cancellationToken);

        var existingByKey = existing.ToDictionary(x => x.Key);
        var updated = new List<MissionTemplate>();

        foreach (var templateDto in templatesDto)
        {
            if (existingByKey.TryGetValue(templateDto.Key, out var existingTemplate))
            {
                // Update existing
                existingTemplate.Title = templateDto.Title;
                existingTemplate.Description = templateDto.Description;
                existingTemplate.MetricType = templateDto.MetricType;
                existingTemplate.Period = templateDto.Period;
                existingTemplate.TargetValue = templateDto.TargetValue;
                existingTemplate.RewardXp = templateDto.RewardXp;
                existingTemplate.SortOrder = templateDto.SortOrder;
                existingTemplate.IsActive = templateDto.IsActive;
                existingTemplate.UpdatedAt = now;
                existingTemplate.Version++;
                _db.MissionTemplates.Update(existingTemplate);
                updated.Add(existingTemplate);
            }
            else
            {
                // Create new
                var newTemplate = new MissionTemplate
                {
                    Id = Guid.NewGuid().ToString("D"),
                    Key = templateDto.Key,
                    Title = templateDto.Title,
                    Description = templateDto.Description,
                    MetricType = templateDto.MetricType,
                    Period = templateDto.Period,
                    TargetValue = templateDto.TargetValue,
                    RewardXp = templateDto.RewardXp,
                    SortOrder = templateDto.SortOrder,
                    IsActive = templateDto.IsActive,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsDeleted = false
                };
                _db.MissionTemplates.Add(newTemplate);
                updated.Add(newTemplate);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        // Return updated templates as DTOs
        var result = updated
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
            .ToList()
            .AsReadOnly();

        return ApiResponse<IReadOnlyList<MissionTemplateDto>>.Ok(result);
    }
}
