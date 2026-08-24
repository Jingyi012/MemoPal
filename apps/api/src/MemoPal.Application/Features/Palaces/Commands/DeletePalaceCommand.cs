using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Deletion;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
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
        var entity = await PalaceAccessPolicy.FindManageablePalaceAsync(
            _db,
            request.PalaceId,
            request.UserId,
            request.IsAdmin,
            cancellationToken);

        if (entity is null) return ApiResponse<bool>.Fail("Palace not found.");

        var now = DateTime.UtcNow;
        entity.IsDeleted = true;
        entity.DeletedAt ??= now;
        entity.UpdatedAt = now;

        await SoftDeleteCascadeHelper.SoftDeleteLocationsByPalaceAsync(
            _db,
            entity.Id,
            now,
            cancellationToken);

        var lessonIds = await _db.Lessons
            .Where(x => x.PalaceId == entity.Id)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        await SoftDeleteCascadeHelper.SoftDeleteLessonAggregatesAsync(
            _db,
            lessonIds,
            now,
            cancellationToken);

        await SoftDeleteCascadeHelper.SoftDeleteUserPalaceLinksAsync(
            _db,
            entity.Id,
            now,
            cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
