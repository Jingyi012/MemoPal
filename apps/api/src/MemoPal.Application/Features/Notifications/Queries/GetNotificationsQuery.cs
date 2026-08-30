using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Notifications.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Notifications.Queries;

public sealed record GetNotificationsQuery(string UserId, int? PageNumber = null, int? PageSize = null) : IRequest<ApiResponse<IReadOnlyList<NotificationDto>>>;

public sealed class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, ApiResponse<IReadOnlyList<NotificationDto>>>
{
    private readonly IAppDbContext _db;

    public GetNotificationsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<NotificationDto>>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var baseQuery = _db.Notifications
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .AsQueryable();

        var usePagination = request.PageNumber.HasValue && request.PageSize.HasValue;

        if (!usePagination)
        {
            var data = await baseQuery.ToListAsync(cancellationToken);
            return ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data.Select(x => x.Adapt<NotificationDto>()).ToList());
        }

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);
        var paged = await baseQuery.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return PaginatedResponse<NotificationDto>.Ok(paged.Select(x => x.Adapt<NotificationDto>()).ToList(), pageNumber, pageSize, totalCount);
    }
}

