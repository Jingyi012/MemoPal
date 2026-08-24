using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserNotificationsQuery(string UserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<ManagedUserNotificationDataDto>>;

public sealed class GetManagedUserNotificationsQueryHandler
    : IRequestHandler<GetManagedUserNotificationsQuery, PaginatedResponse<ManagedUserNotificationDataDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserNotificationsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserNotificationDataDto>> Handle(GetManagedUserNotificationsQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var pageNumber = ManagedUserDataQueryHelpers.NormalizePageNumber(request.PageNumber);
        var pageSize = ManagedUserDataQueryHelpers.NormalizePageSize(request.PageSize);

        var baseQuery = _db.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId)
            .OrderByDescending(x => x.CreatedAt);

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var data = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = data
            .Select(x => new ManagedUserNotificationDataDto(
                x.Id,
                x.Type,
                x.Title,
                x.Body,
                x.ReferenceType,
                x.ReferenceId,
                x.IsRead,
                x.IsDismissed,
                x.ReadAt,
                x.IsDeleted,
                x.CreatedAt,
                x.UpdatedAt))
            .ToList();

        return PaginatedResponse<ManagedUserNotificationDataDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
