using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemoryFolders.DTOs;
using MemoPal.Application.Features.MemoryFolders;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemoryFolders.Queries;

public sealed record GetMemoryFoldersQuery(string UserId)
    : IRequest<ApiResponse<IReadOnlyList<MemoryFolderDto>>>;

public sealed class GetMemoryFoldersQueryHandler(IAppDbContext db)
    : IRequestHandler<GetMemoryFoldersQuery, ApiResponse<IReadOnlyList<MemoryFolderDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<MemoryFolderDto>>> Handle(
        GetMemoryFoldersQuery request,
        CancellationToken cancellationToken)
    {
        var folders = await db.ForUser(request.UserId)
            .OrderBy(x => x.Name)
            .ProjectSummary()
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<MemoryFolderDto>>.Ok(folders);
    }
}
