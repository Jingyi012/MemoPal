using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserMilestonesQuery(string UserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<ManagedUserMilestoneDataDto>>;

public sealed class GetManagedUserMilestonesQueryHandler
    : IRequestHandler<GetManagedUserMilestonesQuery, PaginatedResponse<ManagedUserMilestoneDataDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserMilestonesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserMilestoneDataDto>> Handle(GetManagedUserMilestonesQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var pageNumber = ManagedUserDataQueryHelpers.NormalizePageNumber(request.PageNumber);
        var pageSize = ManagedUserDataQueryHelpers.NormalizePageSize(request.PageSize);

        var baseQuery = from userMilestone in _db.UserMilestones.AsNoTracking()
                        join definition in _db.MilestoneDefinitions.AsNoTracking()
                            on userMilestone.MilestoneId equals definition.Id
                        where userMilestone.UserId == request.UserId
                        orderby userMilestone.UpdatedAt descending
                        select new { UserMilestone = userMilestone, Definition = definition };

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var rows = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows
            .Select(x => new ManagedUserMilestoneDataDto(
                x.UserMilestone.Id,
                x.UserMilestone.MilestoneId,
                x.Definition.Key,
                x.Definition.Title,
                x.Definition.Description,
                x.Definition.ConditionType,
                x.Definition.ConditionValue,
                x.UserMilestone.AchievedAt,
                x.UserMilestone.IsDeleted,
                x.UserMilestone.CreatedAt,
                x.UserMilestone.UpdatedAt))
            .ToList();

        return PaginatedResponse<ManagedUserMilestoneDataDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
