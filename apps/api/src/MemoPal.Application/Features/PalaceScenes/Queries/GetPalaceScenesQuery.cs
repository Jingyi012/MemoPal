using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PalaceScenes.Queries;

public sealed record GetPalaceScenesQuery(string UserId)
    : IRequest<ApiResponse<IReadOnlyList<PalaceSceneDto>>>;

public sealed class GetPalaceScenesQueryHandler
    : IRequestHandler<GetPalaceScenesQuery, ApiResponse<IReadOnlyList<PalaceSceneDto>>>
{
    private readonly IAppDbContext _db;

    public GetPalaceScenesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<ApiResponse<IReadOnlyList<PalaceSceneDto>>> Handle(
        GetPalaceScenesQuery request,
        CancellationToken cancellationToken)
    {
        var scenes = await _db.PalaceScenes
            .AsNoTracking()
            .Include(x => x.Loci.Where(locus => !locus.IsDeleted))
            .Where(x => !x.IsDeleted &&
                ((x.IsTemplate && x.Status == PalaceSceneStatuses.Published) || x.UserId == request.UserId))
            .OrderBy(x => x.UnlockLevel)
            .ThenBy(x => x.IsPremium)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<PalaceSceneDto>>.Ok(
            scenes.Select(PalaceSceneMapper.ToDto).ToList());
    }
}
