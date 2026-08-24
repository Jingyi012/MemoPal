using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Referrals.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Referrals.Queries;

public sealed record GetPagedReferralRecordsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? Search = null,
    string? ReferrerUserId = null)
    : IRequest<PaginatedResponse<AdminReferralRecordDto>>;

public sealed class GetPagedReferralRecordsQueryHandler
    : IRequestHandler<GetPagedReferralRecordsQuery, PaginatedResponse<AdminReferralRecordDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedReferralRecordsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<AdminReferralRecordDto>> Handle(GetPagedReferralRecordsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = from record in _db.ReferralRecords.AsNoTracking()
                    join referrer in _db.Users.AsNoTracking() on record.ReferrerUserId equals referrer.Id
                    join referee in _db.Users.AsNoTracking() on record.RefereeUserId equals referee.Id
                    where !record.IsDeleted && !referrer.IsDeleted && !referee.IsDeleted
                    select new
                    {
                        Record = record,
                        Referrer = referrer,
                        Referee = referee
                    };

        if (!string.IsNullOrWhiteSpace(request.ReferrerUserId))
        {
            var referrerUserId = request.ReferrerUserId.Trim();
            query = query.Where(x => x.Record.ReferrerUserId == referrerUserId);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.Record.ReferralCode.ToLower().Contains(search) ||
                x.Referrer.DisplayName.ToLower().Contains(search) ||
                x.Referrer.Email.ToLower().Contains(search) ||
                x.Referee.DisplayName.ToLower().Contains(search) ||
                x.Referee.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var data = await query
            .OrderByDescending(x => x.Record.RedeemedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminReferralRecordDto(
                x.Record.Id,
                x.Record.ReferralCode,
                x.Record.ReferrerUserId,
                x.Referrer.DisplayName,
                x.Referrer.Email,
                x.Record.RefereeUserId,
                x.Referee.DisplayName,
                x.Referee.Email,
                x.Record.RedeemedAt,
                x.Record.InviterRewardXp,
                x.Record.InviterRewardPremiumDays,
                x.Record.InviteeRewardXp,
                x.Record.InviteeRewardPremiumDays))
            .ToListAsync(cancellationToken);

        return PaginatedResponse<AdminReferralRecordDto>.Ok(data, pageNumber, pageSize, totalCount);
    }
}
