using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Queries;

public sealed record GetMeQuery(string UserId) : IRequest<UserWithStatDto>;

public sealed class GetMeQueryHandler : IRequestHandler<GetMeQuery, UserWithStatDto>
{
    private readonly IAppDbContext _db;

    public GetMeQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<UserWithStatDto> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");
        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);
        return (user, stats).Adapt<UserWithStatDto>();
    }
}
