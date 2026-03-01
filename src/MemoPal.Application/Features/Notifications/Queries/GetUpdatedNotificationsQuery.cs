using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Notifications.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Queries;

public sealed record GetUpdatedNotificationsQuery(string UserId, DateTime Since) : IRequest<IReadOnlyList<NotificationDto>>;

public sealed class GetUpdatedNotificationsQueryHandler : IRequestHandler<GetUpdatedNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedNotificationsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<NotificationDto>> Handle(GetUpdatedNotificationsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.Notifications
            .Where(x => x.UserId == request.UserId && x.UpdatedAt > request.Since)
            .OrderBy(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);
        return data.Select(x => x.Adapt<NotificationDto>()).ToList();
    }
}

