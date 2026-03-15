using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Palaces.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Commands;

public sealed record CreatePalaceCommand(string UserId, PalaceUpsertRequest Request) : IRequest<PalaceDto>;

public sealed class CreatePalaceCommandHandler : IRequestHandler<CreatePalaceCommand, PalaceDto>
{
    private readonly IAppDbContext _db;

    public CreatePalaceCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PalaceDto> Handle(CreatePalaceCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Name) ||
            string.IsNullOrWhiteSpace(request.Request.Description) ||
            string.IsNullOrWhiteSpace(request.Request.Thumbnail))
        {
            throw new ValidationAppException("name, description, and thumbnail are required.");
        }

        var now = DateTime.UtcNow;
        var id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!;
        var entity = await _db.Palaces.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            entity = new Palace
            {
                Id = id,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.Palaces.AddAsync(entity, cancellationToken);
        }

        entity.Name = request.Request.Name.Trim();
        entity.Description = request.Request.Description.Trim();
        entity.Thumbnail = request.Request.Thumbnail.Trim();
        entity.LocationsCount = request.Request.LocationsCount;
        entity.IsLocked = request.Request.IsLocked;
        entity.UnlockedAt = request.Request.UnlockedAt;
        entity.RequiredXp = request.Request.RequiredXp;
        entity.IsPremium = request.Request.IsPremium;
        entity.IsCustom = request.Request.IsCustom;
        entity.CreatedBy = request.Request.IsCustom ? request.UserId : request.Request.CreatedBy;
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return entity.Adapt<PalaceDto>();
    }
}

