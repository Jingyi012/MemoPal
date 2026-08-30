using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetUserStatsQuery(string UserId) : IRequest<ApiResponse<UserStatsDto>>;

public sealed class GetUserStatsQueryHandler : IRequestHandler<GetUserStatsQuery, ApiResponse<UserStatsDto>>
{
    private readonly IAppDbContext _db;

    public GetUserStatsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<UserStatsDto>> Handle(GetUserStatsQuery request, CancellationToken cancellationToken)
    {
        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User stats not found.");
        return ApiResponse<UserStatsDto>.Ok(stats.Adapt<UserStatsDto>());
    }
}




