using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

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
        var entity = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == request.PalaceId &&
                 !x.IsDeleted &&
                 (request.IsAdmin || !x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);

        if (entity is null) return ApiResponse<bool>.Fail("Palace not found.");

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
