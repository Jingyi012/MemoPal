using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Avatars.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Avatars.Commands;

public sealed record CreateAvatarDefinitionCommand(AvatarDefinitionUpsertRequest Request)
    : IRequest<ApiResponse<AvatarDefinitionDto>>;

public sealed class CreateAvatarDefinitionCommandHandler : IRequestHandler<CreateAvatarDefinitionCommand, ApiResponse<AvatarDefinitionDto>>
{
    private readonly IAppDbContext _db;

    public CreateAvatarDefinitionCommandHandler(IAppDbContext db) => _db = db;

    public async Task<ApiResponse<AvatarDefinitionDto>> Handle(CreateAvatarDefinitionCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (string.IsNullOrWhiteSpace(request.Key) ||
            string.IsNullOrWhiteSpace(request.TitleEn) || string.IsNullOrWhiteSpace(request.TitleZh) ||
            string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            throw new ValidationAppException("key, portrait image, titleEn, and titleZh are required.");
        }

        if (request.RequiredLevel < 1)
            throw new ValidationAppException("requiredLevel must be at least 1.");

        var key = request.Key.Trim().ToLowerInvariant();
        var entity = request.Id is null
            ? null
            : await _db.AvatarDefinitions.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        var duplicate = await _db.AvatarDefinitions.AnyAsync(
            x => x.Key == key && x.Id != request.Id && !x.IsDeleted,
            cancellationToken);
        if (duplicate)
            throw new ConflictAppException("An avatar with this key already exists.");

        var now = DateTime.UtcNow;
        if (entity is null)
        {
            entity = new AvatarDefinition
            {
                Id = string.IsNullOrWhiteSpace(request.Id) ? Guid.NewGuid().ToString("N") : request.Id!,
                CreatedAt = now,
                CreatedBy = "admin",
            };
            await _db.AvatarDefinitions.AddAsync(entity, cancellationToken);
        }

        entity.Key = key;
        entity.AssetKey = string.IsNullOrWhiteSpace(request.AssetKey) ? key : request.AssetKey.Trim();
        entity.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        entity.CompanionCharacterImageUrl = string.IsNullOrWhiteSpace(request.CompanionCharacterImageUrl) ? null : request.CompanionCharacterImageUrl.Trim();
        entity.TitleEn = request.TitleEn.Trim();
        entity.TitleZh = request.TitleZh.Trim();
        entity.DescriptionEn = request.DescriptionEn?.Trim() ?? string.Empty;
        entity.DescriptionZh = request.DescriptionZh?.Trim() ?? string.Empty;
        entity.RequiredLevel = request.RequiredLevel;
        entity.SortOrder = request.SortOrder;
        entity.IsActive = request.IsActive;
        entity.IsDeleted = false;
        entity.DeletedAt = null;
        entity.UpdatedAt = now;
        entity.UpdatedBy = "admin";

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<AvatarDefinitionDto>.Ok(entity.Adapt<AvatarDefinitionDto>());
    }
}
