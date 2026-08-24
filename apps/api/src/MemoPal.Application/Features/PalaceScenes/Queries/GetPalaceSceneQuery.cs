using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PalaceScenes.Queries;

public sealed record GetPalaceSceneQuery(string UserId, string PalaceSceneId)
    : IRequest<ApiResponse<PalaceSceneDto>>;

public sealed class GetPalaceSceneQueryHandler
    : IRequestHandler<GetPalaceSceneQuery, ApiResponse<PalaceSceneDto>>
{
    private readonly IAppDbContext _db;

    public GetPalaceSceneQueryHandler(IAppDbContext db) => _db = db;

    public async Task<ApiResponse<PalaceSceneDto>> Handle(
        GetPalaceSceneQuery request,
        CancellationToken cancellationToken)
    {
        var scene = await _db.PalaceScenes
            .AsNoTracking()
            .Include(x => x.Loci.Where(locus => !locus.IsDeleted))
            .FirstOrDefaultAsync(x =>
                x.Id == request.PalaceSceneId &&
                !x.IsDeleted &&
                ((x.IsTemplate && x.Status == PalaceSceneStatuses.Published) || x.UserId == request.UserId),
                cancellationToken)
            ?? throw new NotFoundAppException("Palace scene not found.");

        return ApiResponse<PalaceSceneDto>.Ok(PalaceSceneMapper.ToDto(scene));
    }
}
