using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
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
        var templates = MissionTemplateSerializer.Normalize(request.Request.Templates ?? []);
        var serialized = MissionTemplateSerializer.Serialize(templates);

        var setting = await _db.SystemSettings
            .FirstOrDefaultAsync(x => x.Key == SystemSettingKeys.GamificationMissionTemplates, cancellationToken);

        var now = DateTime.UtcNow;
        if (setting is null)
        {
            setting = new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = SystemSettingKeys.GamificationMissionTemplates,
                Value = serialized,
                Description = "Mission templates for gamification dashboard.",
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };
            _db.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = serialized;
            setting.Description = "Mission templates for gamification dashboard.";
            setting.UpdatedAt = now;
            setting.IsDeleted = false;
            setting.DeletedAt = null;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<MissionTemplateDto>>.Ok(templates);
    }
}
