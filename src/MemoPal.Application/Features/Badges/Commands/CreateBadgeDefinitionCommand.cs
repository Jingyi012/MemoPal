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
    private readonly IAppDbContext _db;

    public CreateBadgeDefinitionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<BadgeDefinitionDto>> Handle(CreateBadgeDefinitionCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Key) || string.IsNullOrWhiteSpace(request.Request.Name))
            throw new ValidationAppException("key and name are required.");

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
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        var result = entity.Adapt<BadgeDefinitionDto>();
        return ApiResponse<BadgeDefinitionDto>.Ok(result);
    }
}
