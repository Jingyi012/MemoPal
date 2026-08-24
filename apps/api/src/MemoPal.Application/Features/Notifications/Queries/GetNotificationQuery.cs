using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Notifications.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Queries;

public sealed record GetNotificationQuery(string UserId, string NotificationId) : IRequest<ApiResponse<NotificationDto>>;

public sealed class GetNotificationQueryHandler : IRequestHandler<GetNotificationQuery, ApiResponse<NotificationDto>>
{
    private readonly IAppDbContext _db;

    public GetNotificationQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<NotificationDto>> Handle(GetNotificationQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.Notifications.FirstOrDefaultAsync(
                x => x.Id == request.NotificationId && x.UserId == request.UserId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Notification not found.");
        return ApiResponse<NotificationDto>.Ok(data.Adapt<NotificationDto>());
    }
}




