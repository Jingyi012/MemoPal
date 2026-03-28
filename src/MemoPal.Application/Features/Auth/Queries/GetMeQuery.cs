using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Auth.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Queries;

public sealed record GetMeQuery(string UserId) : IRequest<ApiResponse<UserWithStatDto>>;

public sealed class GetMeQueryHandler : IRequestHandler<GetMeQuery, ApiResponse<UserWithStatDto>>
{
    private readonly IAppDbContext _db;

    public GetMeQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<UserWithStatDto>> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");
        var levelAdjusted = await _db.EnsureUserLevelMatchesXpAsync(user, cancellationToken);
        if (levelAdjusted)
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);
        return ApiResponse<UserWithStatDto>.Ok((user, stats).Adapt<UserWithStatDto>());
    }
}



