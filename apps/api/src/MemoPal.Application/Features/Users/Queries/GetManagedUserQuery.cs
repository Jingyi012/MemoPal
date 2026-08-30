using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserQuery(string UserId) : IRequest<ApiResponse<ManagedUserDto>>;

public sealed class GetManagedUserQueryHandler : IRequestHandler<GetManagedUserQuery, ApiResponse<ManagedUserDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ManagedUserDto>> Handle(GetManagedUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        return ApiResponse<ManagedUserDto>.Ok(user.Adapt<ManagedUserDto>());
    }
}

