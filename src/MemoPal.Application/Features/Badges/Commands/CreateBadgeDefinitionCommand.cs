using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Commands;

public sealed record CreateBadgeDefinitionCommand(BadgeDefinitionUpsertRequest Request) : IRequest<ApiResponse<BadgeDefinitionDto>>;

public sealed class CreateBadgeDefinitionCommandHandler : IRequestHandler<CreateBadgeDefinitionCommand, ApiResponse<BadgeDefinitionDto>>
{
    private static readonly HashSet<string> AllowedConditionTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "manual",
        "level",
        "lessons_completed",
        "words_learned",
        "streak_days",
        "missions_completed",
        "total_reviews",
        "total_xp"
    };

    private readonly IAppDbContext _db;

    public CreateBadgeDefinitionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<BadgeDefinitionDto>> Handle(CreateBadgeDefinitionCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Key) || string.IsNullOrWhiteSpace(request.Request.Name))
            throw new ValidationAppException("key and name are required.");
        if (string.IsNullOrWhiteSpace(request.Request.ConditionType))
            throw new ValidationAppException("conditionType is required.");

        var normalizedConditionType = request.Request.ConditionType.Trim().ToLowerInvariant();
        if (!AllowedConditionTypes.Contains(normalizedConditionType))
            throw new ValidationAppException($"Unsupported conditionType '{request.Request.ConditionType}'.");

        var conditionValue = request.Request.ConditionValue ?? 0;
        if (!string.Equals(normalizedConditionType, "manual", StringComparison.OrdinalIgnoreCase) && conditionValue <= 0)
            throw new ValidationAppException("conditionValue must be greater than 0 for auto-achievement conditions.");

        var now = DateTime.UtcNow;
        var id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!;

        var entity = await _db.BadgeDefinitions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            entity = new BadgeDefinition
            {
                Id = id,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.BadgeDefinitions.AddAsync(entity, cancellationToken);
        }

        entity.Key = request.Request.Key.Trim();
        entity.Name = request.Request.Name.Trim();
        entity.Description = request.Request.Description;
        entity.Icon = request.Request.Icon;
        entity.IconUrl = request.Request.IconUrl;
        entity.Rarity = request.Request.Rarity;
        entity.ConditionType = normalizedConditionType;
        entity.ConditionValue = conditionValue;
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        var result = entity.Adapt<BadgeDefinitionDto>();
        return ApiResponse<BadgeDefinitionDto>.Ok(result);
    }
}
