using MediatR;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Commands;

public sealed record DeletePalaceCommand(string UserId, string PalaceId) : IRequest<bool>;

public sealed class DeletePalaceCommandHandler : IRequestHandler<DeletePalaceCommand, bool>
{
    private readonly IAppDbContext _db;

    public DeletePalaceCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeletePalaceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == request.PalaceId &&
                 !x.IsDeleted &&
                 (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);

        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

