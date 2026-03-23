using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Commands;

public sealed record DeleteBadgeDefinitionCommand(string BadgeId) : IRequest<ApiResponse<bool>>;

public sealed class DeleteBadgeDefinitionCommandHandler : IRequestHandler<DeleteBadgeDefinitionCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeleteBadgeDefinitionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteBadgeDefinitionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.BadgeDefinitions.FirstOrDefaultAsync(x => x.Id == request.BadgeId && !x.IsDeleted, cancellationToken);
        if (entity is null)
            return ApiResponse<bool>.Ok(false);

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
