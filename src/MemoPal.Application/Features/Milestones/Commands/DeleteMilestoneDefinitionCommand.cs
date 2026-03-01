using MediatR;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Commands;

public sealed record DeleteMilestoneDefinitionCommand(string MilestoneId) : IRequest<bool>;

public sealed class DeleteMilestoneDefinitionCommandHandler : IRequestHandler<DeleteMilestoneDefinitionCommand, bool>
{
    private readonly IAppDbContext _db;

    public DeleteMilestoneDefinitionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeleteMilestoneDefinitionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.MilestoneDefinitions.FirstOrDefaultAsync(x => x.Id == request.MilestoneId && !x.IsDeleted, cancellationToken);
        if (entity is null)
            return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
