using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Commands;

public sealed record DeleteManagedUserCommand(string ActorUserId, string UserId) : IRequest<ApiResponse<bool>>;

public sealed class DeleteManagedUserCommandHandler : IRequestHandler<DeleteManagedUserCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeleteManagedUserCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteManagedUserCommand request, CancellationToken cancellationToken)
    {
        if (request.ActorUserId == request.UserId)
            throw new ConflictAppException("You cannot deactivate your own administrator account.");

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken);
        if (user is null)
            return ApiResponse<bool>.Ok(false);

        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);
        if (stats is not null)
        {
            stats.IsDeleted = true;
            stats.DeletedAt = DateTime.UtcNow;
            stats.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
