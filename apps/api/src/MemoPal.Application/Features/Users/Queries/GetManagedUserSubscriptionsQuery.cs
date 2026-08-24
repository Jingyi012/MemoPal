using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserSubscriptionsQuery(string UserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<ManagedUserSubscriptionDataDto>>;

public sealed class GetManagedUserSubscriptionsQueryHandler
    : IRequestHandler<GetManagedUserSubscriptionsQuery, PaginatedResponse<ManagedUserSubscriptionDataDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserSubscriptionsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserSubscriptionDataDto>> Handle(GetManagedUserSubscriptionsQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var pageNumber = ManagedUserDataQueryHelpers.NormalizePageNumber(request.PageNumber);
        var pageSize = ManagedUserDataQueryHelpers.NormalizePageSize(request.PageSize);

        var baseQuery = _db.UserSubscriptions
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId)
            .OrderByDescending(x => x.StartedAt);

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var data = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = data
            .Select(x => new ManagedUserSubscriptionDataDto(
                x.Id,
                x.PlanId,
                x.Provider,
                x.ProviderReference,
                x.Status,
                x.StartedAt,
                x.ExpiresAt,
                x.AutoRenew,
                x.LastVerifiedAt,
                x.IsDeleted,
                x.CreatedAt,
                x.UpdatedAt))
            .ToList();

        return PaginatedResponse<ManagedUserSubscriptionDataDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
