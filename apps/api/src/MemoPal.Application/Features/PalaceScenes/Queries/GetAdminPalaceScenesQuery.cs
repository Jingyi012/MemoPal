using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PalaceScenes.Queries;

public sealed record GetAdminPalaceScenesQuery : IRequest<ApiResponse<IReadOnlyList<PalaceSceneDto>>>;

public sealed class GetAdminPalaceScenesQueryHandler(IAppDbContext db)
    : IRequestHandler<GetAdminPalaceScenesQuery, ApiResponse<IReadOnlyList<PalaceSceneDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PalaceSceneDto>>> Handle(GetAdminPalaceScenesQuery request, CancellationToken cancellationToken)
    {
        var scenes = await db.PalaceScenes.AsNoTracking()
            .Include(x => x.Loci.Where(locus => !locus.IsDeleted))
            .Where(x => !x.IsDeleted && x.IsTemplate)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<PalaceSceneDto>>.Ok(scenes.Select(PalaceSceneMapper.ToDto).ToList());
    }
}
