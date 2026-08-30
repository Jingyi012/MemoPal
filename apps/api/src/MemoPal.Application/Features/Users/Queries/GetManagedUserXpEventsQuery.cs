using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserXpEventsQuery(string UserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<ManagedUserXpEventDataDto>>;

public sealed class GetManagedUserXpEventsQueryHandler
    : IRequestHandler<GetManagedUserXpEventsQuery, PaginatedResponse<ManagedUserXpEventDataDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserXpEventsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserXpEventDataDto>> Handle(GetManagedUserXpEventsQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var pageNumber = ManagedUserDataQueryHelpers.NormalizePageNumber(request.PageNumber);
        var pageSize = ManagedUserDataQueryHelpers.NormalizePageSize(request.PageSize);

        var baseQuery = _db.XpEvents
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId)
            .OrderByDescending(x => x.CreatedAt);

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var data = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = data
            .Select(x => new ManagedUserXpEventDataDto(
                x.Id,
                x.SourceType,
                x.SourceId,
                x.XpAmount,
                x.ClientEventId,
                x.IsDeleted,
                x.CreatedAt,
                x.UpdatedAt))
            .ToList();

        return PaginatedResponse<ManagedUserXpEventDataDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
