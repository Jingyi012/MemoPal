using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Notifications.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Queries;

public sealed record GetNotificationsQuery(string UserId) : IRequest<IReadOnlyList<NotificationDto>>;

public sealed class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    private readonly IAppDbContext _db;

    public GetNotificationsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.Notifications
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return data.Select(x => x.Adapt<NotificationDto>()).ToList();
    }
}

