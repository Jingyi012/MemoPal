using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;

namespace MemoPal.Application.Features.Palaces.Commands;

public sealed record DeletePalaceCommand(string UserId, string PalaceId, bool IsAdmin = false) : IRequest<ApiResponse<bool>>;

public sealed class DeletePalaceCommandHandler : IRequestHandler<DeletePalaceCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeletePalaceCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeletePalaceCommand request, CancellationToken cancellationToken)
    {
        var entity = await PalaceAccessPolicy.FindManageablePalaceAsync(
            _db,
            request.PalaceId,
            request.UserId,
            request.IsAdmin,
            cancellationToken);

        if (entity is null) return ApiResponse<bool>.Fail("Palace not found.");

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
