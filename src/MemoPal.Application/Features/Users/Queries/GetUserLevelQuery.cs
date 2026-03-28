using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetUserLevelQuery(string UserId) : IRequest<ApiResponse<UserLevelDto>>;

public sealed class GetUserLevelQueryHandler : IRequestHandler<GetUserLevelQuery, ApiResponse<UserLevelDto>>
{
    private readonly IAppDbContext _db;

    public GetUserLevelQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<UserLevelDto>> Handle(GetUserLevelQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var levelAdjusted = await _db.EnsureUserLevelMatchesXpAsync(user, cancellationToken);
        if (levelAdjusted)
        {
            await _db.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<UserLevelDto>.Ok(new UserLevelDto(user.Level, user.TotalXp));
    }
}




