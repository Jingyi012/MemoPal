using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Media;
using MemoPal.Application.Common.Security;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record UpdateLocationCommand(string UserId, string LocationId, LocationUpsertRequest Request, bool IsAdmin = false) : IRequest<ApiResponse<LocationDto>>;

public sealed class UpdateLocationCommandHandler : IRequestHandler<UpdateLocationCommand, ApiResponse<LocationDto>>
{
    private readonly IAppDbContext _db;

    public UpdateLocationCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<LocationDto>> Handle(UpdateLocationCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Locations.FirstOrDefaultAsync(x => x.Id == request.LocationId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Location not found.");

        var palace = await PalaceAccessPolicy.FindManageablePalaceAsync(
            _db,
            entity.PalaceId,
            request.UserId,
            request.IsAdmin,
            cancellationToken);
        if (palace is null) throw new NotFoundAppException("Location not found.");

        if (!string.IsNullOrWhiteSpace(request.Request.Name)) entity.Name = request.Request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.Description)) entity.Description = request.Request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.ImageUrl)) entity.ImageUrl = MediaPathNormalizer.Normalize(request.Request.ImageUrl);
        entity.Position = request.Request.Position;
        entity.UpdatedAt = request.Request.UpdatedAt ?? DateTime.UtcNow;
        entity.IsDeleted = request.Request.IsDeleted ?? entity.IsDeleted;
        entity.DeletedAt = request.Request.DeletedAt ?? entity.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        var result = entity.Adapt<LocationDto>();
        return ApiResponse<LocationDto>.Ok(result);
    }
}

