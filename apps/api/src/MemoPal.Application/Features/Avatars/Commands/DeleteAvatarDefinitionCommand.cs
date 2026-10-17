using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Avatars.Commands;

public sealed record DeleteAvatarDefinitionCommand(string AvatarId) : IRequest<ApiResponse<bool>>;

public sealed class DeleteAvatarDefinitionCommandHandler : IRequestHandler<DeleteAvatarDefinitionCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeleteAvatarDefinitionCommandHandler(IAppDbContext db) => _db = db;

    public async Task<ApiResponse<bool>> Handle(DeleteAvatarDefinitionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.AvatarDefinitions.FirstOrDefaultAsync(
            x => x.Id == request.AvatarId && !x.IsDeleted,
            cancellationToken);
        if (entity is null) return ApiResponse<bool>.Ok(false);

        entity.IsDeleted = true;
        entity.IsActive = false;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = "admin";
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
