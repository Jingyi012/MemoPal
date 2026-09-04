using MemoPal.Application.Features.PalaceScenes.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.PalaceScenes;

internal static class PalaceSceneMapper
{
    public static PalaceSceneDto ToDto(PalaceScene scene) => new(
        scene.Id,
        scene.Name,
        scene.Description,
        scene.ImageUrl,
        scene.Status,
        scene.IsTemplate,
        scene.IsPremium,
        scene.Version,
        scene.Loci
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Position)
            .Select(x => new PalaceLocusDto(
                x.Id,
                x.Position,
                x.Name,
                x.Description,
                x.NameEn,
                x.NameZh,
                x.DescriptionEn,
                x.DescriptionZh,
                x.XPercent,
                x.YPercent,
                x.RadiusPercent,
                x.CreatedAt,
                x.CreatedBy,
                x.UpdatedAt,
                x.UpdatedBy))
            .ToList(),
        scene.CreatedAt,
        scene.CreatedBy,
        scene.UpdatedAt,
        scene.UpdatedBy);
}
