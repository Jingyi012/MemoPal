using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Locations.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record CreateLocationCommand(string UserId, LocationUpsertRequest Request) : IRequest<LocationDto>;

public sealed class CreateLocationCommandHandler : IRequestHandler<CreateLocationCommand, LocationDto>
{
    private readonly IAppDbContext _db;

    public CreateLocationCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<LocationDto> Handle(CreateLocationCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.PalaceId) ||
            string.IsNullOrWhiteSpace(request.Request.Name) ||
            string.IsNullOrWhiteSpace(request.Request.Description) ||
            string.IsNullOrWhiteSpace(request.Request.ImageUrl))
        {
            throw new ValidationAppException("palaceId, name, description, and imageUrl are required.");
        }

        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == request.Request.PalaceId && !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);
        if (palace is null) throw new NotFoundAppException("Palace not found.");

        var now = DateTime.UtcNow;
        var id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!;
        var entity = await _db.Locations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            entity = new Location
            {
                Id = id,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.Locations.AddAsync(entity, cancellationToken);
        }

        entity.PalaceId = request.Request.PalaceId;
        entity.Position = request.Request.Position;
        entity.Name = request.Request.Name.Trim();
        entity.Description = request.Request.Description.Trim();
        entity.ImageUrl = request.Request.ImageUrl.Trim();
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        palace.LocationsCount = await _db.Locations.CountAsync(x => x.PalaceId == palace.Id && !x.IsDeleted, cancellationToken);
        palace.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);
        return entity.Adapt<LocationDto>();
    }
}

