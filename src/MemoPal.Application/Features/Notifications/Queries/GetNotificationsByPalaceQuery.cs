using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Notifications.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Queries;

public sealed record GetNotificationsByPalaceQuery(string UserId, string PalaceId) : IRequest<ApiResponse<IReadOnlyList<NotificationDto>>>;

public sealed class GetNotificationsByPalaceQueryHandler : IRequestHandler<GetNotificationsByPalaceQuery, ApiResponse<IReadOnlyList<NotificationDto>>>
{
    private readonly IAppDbContext _db;

    public GetNotificationsByPalaceQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<NotificationDto>>> Handle(GetNotificationsByPalaceQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.Notifications
            .Where(x => x.UserId == request.UserId &&
                        !x.IsDeleted &&
                        x.ReferenceId == request.PalaceId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var items = data.Select(x => x.Adapt<NotificationDto>()).ToList();
        return ApiResponse<IReadOnlyList<NotificationDto>>.Ok(items);
    }
}

