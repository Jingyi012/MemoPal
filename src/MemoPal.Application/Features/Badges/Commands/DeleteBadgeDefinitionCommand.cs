using MediatR;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Commands;

public sealed record DeleteBadgeDefinitionCommand(string BadgeId) : IRequest<bool>;

public sealed class DeleteBadgeDefinitionCommandHandler : IRequestHandler<DeleteBadgeDefinitionCommand, bool>
{
    private readonly IAppDbContext _db;

    public DeleteBadgeDefinitionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeleteBadgeDefinitionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.BadgeDefinitions.FirstOrDefaultAsync(x => x.Id == request.BadgeId && !x.IsDeleted, cancellationToken);
        if (entity is null)
            return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
