using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Commands;

public sealed record DeleteMilestoneDefinitionCommand(string MilestoneId) : IRequest<ApiResponse<bool>>;

public sealed class DeleteMilestoneDefinitionCommandHandler : IRequestHandler<DeleteMilestoneDefinitionCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeleteMilestoneDefinitionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteMilestoneDefinitionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.MilestoneDefinitions.FirstOrDefaultAsync(x => x.Id == request.MilestoneId && !x.IsDeleted, cancellationToken);
        if (entity is null)
            return ApiResponse<bool>.Ok(false);

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
