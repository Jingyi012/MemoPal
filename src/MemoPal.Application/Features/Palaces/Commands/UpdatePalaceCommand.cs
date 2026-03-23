using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Media;
using MemoPal.Application.Common.Security;
using MemoPal.Application.Features.Palaces.DTOs;

namespace MemoPal.Application.Features.Palaces.Commands;

public sealed record UpdatePalaceCommand(string UserId, string PalaceId, PalaceUpsertRequest Request, bool IsAdmin = false) : IRequest<ApiResponse<PalaceDto>>;

public sealed class UpdatePalaceCommandHandler : IRequestHandler<UpdatePalaceCommand, ApiResponse<PalaceDto>>
{
    private readonly IAppDbContext _db;

    public UpdatePalaceCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PalaceDto>> Handle(UpdatePalaceCommand request, CancellationToken cancellationToken)
    {
        var entity = await PalaceAccessPolicy.FindManageablePalaceAsync(
                _db,
                request.PalaceId,
                request.UserId,
                request.IsAdmin,
                cancellationToken)
            ?? throw new NotFoundAppException("Palace not found.");

        if (!string.IsNullOrWhiteSpace(request.Request.Name)) entity.Name = request.Request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.Description)) entity.Description = request.Request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.Thumbnail)) entity.Thumbnail = MediaPathNormalizer.Normalize(request.Request.Thumbnail);

        entity.LocationsCount = request.Request.LocationsCount;
        entity.IsLocked = request.Request.IsLocked;
        entity.UnlockedAt = request.Request.UnlockedAt;
        entity.Level = Math.Max(1, request.Request.Level);
        entity.IsPremium = request.Request.IsPremium;
        entity.IsCustom = request.Request.IsCustom;
        entity.UpdatedAt = request.Request.UpdatedAt ?? DateTime.UtcNow;
        entity.IsDeleted = request.Request.IsDeleted ?? entity.IsDeleted;
        entity.DeletedAt = request.Request.DeletedAt ?? entity.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PalaceDto>.Ok(entity.Adapt<PalaceDto>());
    }
}

