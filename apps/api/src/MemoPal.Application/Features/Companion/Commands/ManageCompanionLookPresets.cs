using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Companion.DTOs;
using MemoPal.Application.Features.Companion.Queries;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Companion.Commands;

public sealed record CreateCompanionLookPresetRequest(string AvatarId, string Name, CompanionLookDto Look);
public sealed record CreateCompanionLookPresetCommand(string UserId, CreateCompanionLookPresetRequest Request)
    : IRequest<ApiResponse<CompanionLookPresetDto>>;

public sealed class CreateCompanionLookPresetCommandHandler(IAppDbContext db)
    : IRequestHandler<CreateCompanionLookPresetCommand, ApiResponse<CompanionLookPresetDto>>
{
    public async Task<ApiResponse<CompanionLookPresetDto>> Handle(CreateCompanionLookPresetCommand command, CancellationToken ct)
    {
        if (command.Request.Look is null)
            throw new ValidationAppException("A preset look is required.");
        var name = command.Request.Name?.Trim();
        if (string.IsNullOrEmpty(name) || name.Length > 30)
            throw new ValidationAppException("Preset name must be between 1 and 30 characters.");
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == command.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("User not found.");
        var avatarId = await GetCompanionQueryHandler.ResolveAvatarId(db, user.CompanionAvatarId, user.Level, ct);
        if (string.IsNullOrWhiteSpace(avatarId) || command.Request.AvatarId != avatarId)
            throw new ValidationAppException("The requested companion is not the selected unlocked companion.");
        var avatarKey = await db.AvatarDefinitions.AsNoTracking().Where(x => x.Id == avatarId)
            .Select(x => x.Key).FirstAsync(ct);
        var look = command.Request.Look;
        await SaveCompanionLookCommandHandler.ValidateItems(db,
            new(avatarId, look.HeadwearId, look.BodywearId, look.BackwearId, look.HandItemId), avatarKey, user.Level, ct);
        var presets = db.CompanionLookPresets.Where(x => x.UserId == user.Id && x.AvatarId == avatarId && !x.IsDeleted);
        if (await presets.AnyAsync(x => x.Name == name, ct))
            throw new ConflictAppException("A preset with this name already exists.");
        if (await presets.CountAsync(ct) >= 5)
            throw new ConflictAppException("A companion can have at most five named presets.");
        var entity = new CompanionLookPreset
        {
            Id = Guid.NewGuid().ToString("D"), UserId = user.Id, AvatarId = avatarId, Name = name,
            HeadwearId = Normalize(look.HeadwearId), BodywearId = Normalize(look.BodywearId),
            BackwearId = Normalize(look.BackwearId), HandItemId = Normalize(look.HandItemId)
        };
        await db.CompanionLookPresets.AddAsync(entity, ct);
        await db.SaveChangesAsync(ct);
        return ApiResponse<CompanionLookPresetDto>.Ok(ToDto(entity));
    }

    internal static CompanionLookPresetDto ToDto(CompanionLookPreset x) => new(x.Id, x.AvatarId, x.Name,
        new(x.HeadwearId, x.BodywearId, x.BackwearId, x.HandItemId), x.CreatedAt);
    private static string? Normalize(string? x) => string.IsNullOrWhiteSpace(x) ? null : x.Trim();
}

public sealed record EquipCompanionLookPresetCommand(string UserId, string PresetId)
    : IRequest<ApiResponse<CompanionDto>>;

public sealed class EquipCompanionLookPresetCommandHandler(IAppDbContext db)
    : IRequestHandler<EquipCompanionLookPresetCommand, ApiResponse<CompanionDto>>
{
    public async Task<ApiResponse<CompanionDto>> Handle(EquipCompanionLookPresetCommand command, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == command.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("User not found.");
        var avatarId = await GetCompanionQueryHandler.ResolveAvatarId(db, user.CompanionAvatarId, user.Level, ct);
        var preset = await db.CompanionLookPresets.FirstOrDefaultAsync(x => x.Id == command.PresetId &&
            x.UserId == user.Id && x.AvatarId == avatarId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Companion preset not found.");
        var avatarKey = await db.AvatarDefinitions.AsNoTracking().Where(x => x.Id == avatarId)
            .Select(x => x.Key).FirstAsync(ct);
        await SaveCompanionLookCommandHandler.ValidateItems(db,
            new(avatarId!, preset.HeadwearId, preset.BodywearId, preset.BackwearId, preset.HandItemId), avatarKey, user.Level, ct);
        var equipped = await db.CompanionLooks.FirstOrDefaultAsync(x => x.UserId == user.Id && x.AvatarId == avatarId && !x.IsDeleted, ct);
        if (equipped is null)
        {
            equipped = new CompanionLook { Id = Guid.NewGuid().ToString("D"), UserId = user.Id, AvatarId = avatarId! };
            await db.CompanionLooks.AddAsync(equipped, ct);
        }
        equipped.HeadwearId = preset.HeadwearId;
        equipped.BodywearId = preset.BodywearId;
        equipped.BackwearId = preset.BackwearId;
        equipped.HandItemId = preset.HandItemId;
        await db.SaveChangesAsync(ct);
        return await new GetCompanionQueryHandler(db).Handle(new(user.Id), ct);
    }
}

public sealed record DeleteCompanionLookPresetCommand(string UserId, string PresetId) : IRequest<ApiResponse<bool>>;

public sealed class DeleteCompanionLookPresetCommandHandler(IAppDbContext db)
    : IRequestHandler<DeleteCompanionLookPresetCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteCompanionLookPresetCommand command, CancellationToken ct)
    {
        var preset = await db.CompanionLookPresets.FirstOrDefaultAsync(x => x.Id == command.PresetId &&
            x.UserId == command.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Companion preset not found.");
        preset.IsDeleted = true;
        preset.DeletedAt = DateTime.UtcNow;
        preset.DeletedBy = command.UserId;
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
