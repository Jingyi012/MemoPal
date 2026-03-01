using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Notifications.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Queries;

public sealed record GetNotificationsByPalaceQuery(string UserId, string PalaceId) : IRequest<IReadOnlyList<NotificationDto>>;

public sealed class GetNotificationsByPalaceQueryHandler : IRequestHandler<GetNotificationsByPalaceQuery, IReadOnlyList<NotificationDto>>
{
    private readonly IAppDbContext _db;

    public GetNotificationsByPalaceQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<NotificationDto>> Handle(GetNotificationsByPalaceQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.Notifications
            .Where(x => x.UserId == request.UserId &&
                        !x.IsDeleted &&
                        x.ReferenceId == request.PalaceId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return data.Select(x => x.Adapt<NotificationDto>()).ToList();
    }
}

