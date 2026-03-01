using MediatR;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Commands;

public sealed record DeleteLevelConfigCommand(int Level) : IRequest<bool>;

public sealed class DeleteLevelConfigCommandHandler : IRequestHandler<DeleteLevelConfigCommand, bool>
{
    private readonly IAppDbContext _db;

    public DeleteLevelConfigCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeleteLevelConfigCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.LevelConfigs.FirstOrDefaultAsync(x => x.Level == request.Level && !x.IsDeleted, cancellationToken);
        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

