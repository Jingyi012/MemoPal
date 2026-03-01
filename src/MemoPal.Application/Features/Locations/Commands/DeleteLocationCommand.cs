using MediatR;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record DeleteLocationCommand(string UserId, string LocationId) : IRequest<bool>;

public sealed class DeleteLocationCommandHandler : IRequestHandler<DeleteLocationCommand, bool>
{
    private readonly IAppDbContext _db;

    public DeleteLocationCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeleteLocationCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Locations.FirstOrDefaultAsync(x => x.Id == request.LocationId && !x.IsDeleted, cancellationToken);
        if (entity is null) return false;

        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == entity.PalaceId && !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);
        if (palace is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        palace.LocationsCount = await _db.Locations.CountAsync(x => x.PalaceId == palace.Id && !x.IsDeleted, cancellationToken);
        palace.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
