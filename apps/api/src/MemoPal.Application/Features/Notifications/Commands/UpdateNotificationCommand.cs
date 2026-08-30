using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Notifications.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Commands;

public sealed record UpdateNotificationCommand(string UserId, string NotificationId, NotificationUpsertRequest Request) : IRequest<ApiResponse<NotificationDto>>;

public sealed class UpdateNotificationCommandHandler : IRequestHandler<UpdateNotificationCommand, ApiResponse<NotificationDto>>
{
    private readonly IAppDbContext _db;

    public UpdateNotificationCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<NotificationDto>> Handle(UpdateNotificationCommand request, CancellationToken cancellationToken)
    {
        if (request.Request.Scope == "all")
        {
            var now = DateTime.UtcNow;
            var all = await _db.Notifications
                .Where(x => x.UserId == request.UserId && !x.IsDeleted)
                .ToListAsync(cancellationToken);

            foreach (var n in all)
            {
                n.IsRead = request.Request.IsRead;
                n.ReadAt = request.Request.ReadAt ?? now;
                n.UpdatedAt = now;
            }

            await _db.SaveChangesAsync(cancellationToken);

            var latest = all.OrderByDescending(x => x.UpdatedAt).FirstOrDefault()
                ?? throw new NotFoundAppException("Notification not found.");
            return ApiResponse<NotificationDto>.Ok(latest.Adapt<NotificationDto>());
        }

        var entity = await _db.Notifications.FirstOrDefaultAsync(
                x => x.Id == request.NotificationId && x.UserId == request.UserId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Notification not found.");

        if (!string.IsNullOrWhiteSpace(request.Request.Type)) entity.Type = request.Request.Type.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.Title)) entity.Title = request.Request.Title.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.Body)) entity.Body = request.Request.Body.Trim();
        entity.ReferenceType = request.Request.ReferenceType ?? entity.ReferenceType;
        entity.ReferenceId = request.Request.ReferenceId ?? entity.ReferenceId;
        entity.IsRead = request.Request.IsRead;
        entity.IsDismissed = request.Request.IsDismissed;
        entity.ReadAt = request.Request.ReadAt;
        entity.UpdatedAt = request.Request.UpdatedAt ?? DateTime.UtcNow;
        entity.IsDeleted = request.Request.IsDeleted ?? entity.IsDeleted;
        entity.DeletedAt = request.Request.DeletedAt ?? entity.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        var result = entity.Adapt<NotificationDto>();
        return ApiResponse<NotificationDto>.Ok(result);
    }
}

