using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PalaceScenes.Admin.Queries;

public sealed record GetPalaceScenesQuery : IRequest<ApiResponse<IReadOnlyList<PalaceSceneDto>>>;

public sealed class GetPalaceScenesQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPalaceScenesQuery, ApiResponse<IReadOnlyList<PalaceSceneDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PalaceSceneDto>>> Handle(GetPalaceScenesQuery request, CancellationToken cancellationToken)
    {
        var scenes = await db.PalaceScenes.AsNoTracking()
            .Include(x => x.Loci.Where(locus => !locus.IsDeleted))
            .Where(x => !x.IsDeleted && x.IsTemplate)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<PalaceSceneDto>>.Ok(scenes.Select(PalaceSceneMapper.ToDto).ToList());
    }
}
