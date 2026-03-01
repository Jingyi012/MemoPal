using MediatR;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Commands;

public sealed record DeleteXpConfigCommand(string Id) : IRequest<bool>;

public sealed class DeleteXpConfigCommandHandler : IRequestHandler<DeleteXpConfigCommand, bool>
{
    private readonly IAppDbContext _db;

    public DeleteXpConfigCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeleteXpConfigCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.XpConfigs.FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);
        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
