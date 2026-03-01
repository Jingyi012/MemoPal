using MediatR;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Commands;

public sealed record DeleteNotificationCommand(string UserId, string NotificationId) : IRequest<bool>;

public sealed class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, bool>
{
    private readonly IAppDbContext _db;

    public DeleteNotificationCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeleteNotificationCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Notifications.FirstOrDefaultAsync(
            x => x.Id == request.NotificationId && x.UserId == request.UserId && !x.IsDeleted,
            cancellationToken);
        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
