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

public sealed record GetPagedManagedUsersQuery(int PageNumber = 1, int PageSize = 10, string? Search = null, bool IncludeDeleted = false) : IRequest<PaginatedResponse<ManagedUserDto>>;

public sealed class GetPagedManagedUsersQueryHandler : IRequestHandler<GetPagedManagedUsersQuery, PaginatedResponse<ManagedUserDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedManagedUsersQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserDto>> Handle(GetPagedManagedUsersQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 200);

        var query = _db.Users.AsNoTracking();
        if (!request.IncludeDeleted)
            query = query.Where(x => !x.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Email.Contains(search) || x.DisplayName.Contains(search));
        }

        query = query.OrderByDescending(x => x.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var data = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PaginatedResponse<ManagedUserDto>.Ok(
            data.Select(x => x.Adapt<ManagedUserDto>()).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }
}

