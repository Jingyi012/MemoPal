using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetUserLevelQuery(string UserId) : IRequest<UserLevelDto>;

public sealed class GetUserLevelQueryHandler : IRequestHandler<GetUserLevelQuery, UserLevelDto>
{
    private readonly IAppDbContext _db;

    public GetUserLevelQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<UserLevelDto> Handle(GetUserLevelQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");
        return new UserLevelDto(user.Level, user.TotalXp);
    }
}

