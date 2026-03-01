using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Notifications.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Commands;

public sealed record CreateNotificationCommand(string UserId, NotificationUpsertRequest Request) : IRequest<NotificationDto>;

public sealed class CreateNotificationCommandHandler : IRequestHandler<CreateNotificationCommand, NotificationDto>
{
    private readonly IAppDbContext _db;

    public CreateNotificationCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<NotificationDto> Handle(CreateNotificationCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Type) ||
            string.IsNullOrWhiteSpace(request.Request.Title) ||
            string.IsNullOrWhiteSpace(request.Request.Body))
        {
            throw new ValidationAppException("type, title, and body are required.");
        }

        var now = DateTime.UtcNow;
        var id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!;
        var entity = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            entity = new Notification
            {
                Id = id,
                UserId = request.UserId,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.Notifications.AddAsync(entity, cancellationToken);
        }

        entity.Type = request.Request.Type.Trim();
        entity.Title = request.Request.Title.Trim();
        entity.Body = request.Request.Body.Trim();
        entity.ReferenceType = request.Request.ReferenceType;
        entity.ReferenceId = request.Request.ReferenceId;
        entity.IsRead = request.Request.IsRead;
        entity.IsDismissed = request.Request.IsDismissed;
        entity.ReadAt = request.Request.ReadAt;
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.LastSyncedAt = request.Request.LastSyncedAt;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return entity.Adapt<NotificationDto>();
    }
}

