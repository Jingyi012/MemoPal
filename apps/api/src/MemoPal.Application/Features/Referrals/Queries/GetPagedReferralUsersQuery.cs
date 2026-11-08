using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Referrals.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Referrals.Queries;

public sealed record GetPagedReferralUsersQuery(int PageNumber = 1, int PageSize = 20, string? Search = null)
    : IRequest<PaginatedResponse<ReferralUserView>>;

public sealed class GetPagedReferralUsersQueryHandler
    : IRequestHandler<GetPagedReferralUsersQuery, PaginatedResponse<ReferralUserView>>
{
    private readonly IAppDbContext _db;

    public GetPagedReferralUsersQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ReferralUserView>> Handle(GetPagedReferralUsersQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = from profile in _db.ReferralProfiles.AsNoTracking()
                    join user in _db.Users.AsNoTracking() on profile.UserId equals user.Id
                    where !profile.IsDeleted && !user.IsDeleted
                    select new
                    {
                        profile.UserId,
                        profile.ReferralCode,
                        user.DisplayName,
                        user.Email,
                        profile.CreatedAt,
                        profile.UpdatedAt
                    };

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.ReferralCode.ToLower().Contains(search) ||
                x.DisplayName.ToLower().Contains(search) ||
                x.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageItems = await query
            .OrderByDescending(x => x.UpdatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var referrerIds = pageItems.Select(x => x.UserId).Distinct().ToList();

        var recordStats = referrerIds.Count == 0
            ? []
            : await _db.ReferralRecords
                .AsNoTracking()
                .Where(x => referrerIds.Contains(x.ReferrerUserId) && !x.IsDeleted)
                .GroupBy(x => x.ReferrerUserId)
                .Select(g => new
                {
                    ReferrerUserId = g.Key,
                    SuccessfulReferrals = g.Count(),
                    RewardXp = g.Sum(x => x.InviterRewardXp),
                    RewardAiCredits = g.Sum(x => x.InviterRewardAiCredits),
                    RewardPremiumDays = g.Sum(x => x.InviterRewardPremiumDays),
                    LastReferralAt = g.Max(x => x.RedeemedAt)
                })
                .ToListAsync(cancellationToken);

        var milestoneStats = referrerIds.Count == 0
            ? []
            : await _db.ReferralMilestoneRewards
                .AsNoTracking()
                .Where(x => referrerIds.Contains(x.ReferrerUserId) && !x.IsDeleted)
                .GroupBy(x => x.ReferrerUserId)
                .Select(g => new
                {
                    ReferrerUserId = g.Key,
                    RewardXp = g.Sum(x => x.RewardXp),
                    RewardAiCredits = g.Sum(x => x.RewardAiCredits),
                    RewardPremiumDays = g.Sum(x => x.RewardPremiumDays)
                })
                .ToListAsync(cancellationToken);

        var recordMap = recordStats.ToDictionary(x => x.ReferrerUserId, StringComparer.Ordinal);
        var milestoneMap = milestoneStats.ToDictionary(x => x.ReferrerUserId, StringComparer.Ordinal);

        var data = pageItems
            .Select(item =>
            {
                var record = recordMap.GetValueOrDefault(item.UserId);
                var milestone = milestoneMap.GetValueOrDefault(item.UserId);

                return new ReferralUserView(
                    item.UserId,
                    item.DisplayName,
                    item.Email,
                    item.ReferralCode,
                    record?.SuccessfulReferrals ?? 0,
                    Math.Max(0, (record?.RewardXp ?? 0) + (milestone?.RewardXp ?? 0)),
                    Math.Max(0, (record?.RewardPremiumDays ?? 0) + (milestone?.RewardPremiumDays ?? 0)),
                    record?.LastReferralAt,
                    item.CreatedAt,
                    item.UpdatedAt,
                    (record?.RewardAiCredits ?? 0) + (milestone?.RewardAiCredits ?? 0));
            })
            .ToList();

        return PaginatedResponse<ReferralUserView>.Ok(data, pageNumber, pageSize, totalCount);
    }
}
