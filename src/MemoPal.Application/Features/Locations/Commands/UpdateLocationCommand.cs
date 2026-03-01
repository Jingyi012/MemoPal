using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record UpdateLocationCommand(string UserId, string LocationId, LocationUpsertRequest Request) : IRequest<LocationDto>;

public sealed class UpdateLocationCommandHandler : IRequestHandler<UpdateLocationCommand, LocationDto>
{
    private readonly IAppDbContext _db;

    public UpdateLocationCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<LocationDto> Handle(UpdateLocationCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Locations.FirstOrDefaultAsync(x => x.Id == request.LocationId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Location not found.");

        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == entity.PalaceId && !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);
        if (palace is null) throw new NotFoundAppException("Location not found.");

        if (!string.IsNullOrWhiteSpace(request.Request.Name)) entity.Name = request.Request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.Description)) entity.Description = request.Request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.ImageUrl)) entity.ImageUrl = request.Request.ImageUrl.Trim();
        entity.Position = request.Request.Position;
        entity.UpdatedAt = request.Request.UpdatedAt ?? DateTime.UtcNow;
        entity.LastSyncedAt = request.Request.LastSyncedAt;
        entity.IsDeleted = request.Request.IsDeleted ?? entity.IsDeleted;
        entity.DeletedAt = request.Request.DeletedAt ?? entity.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return entity.Adapt<LocationDto>();
    }
}

