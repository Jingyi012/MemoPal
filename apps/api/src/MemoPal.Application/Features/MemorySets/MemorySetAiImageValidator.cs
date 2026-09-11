using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets;

internal static class MemorySetAiImageValidator
{
    public const string Prefix = "/v1/ai-credits/images/";
    public static async Task ValidateAsync(IAppDbContext db, string userId, MemorySetUpsertRequest request, CancellationToken ct)
    {
        var urls = (request.TechniquePlan?.PegBindings.Select(x => x.SceneAssetUrl) ?? [])
            .Concat(request.TechniquePlan?.PalaceBindings.Select(x => x.SceneAssetUrl) ?? []);
        foreach (var url in urls.Where(x => x?.Contains(Prefix, StringComparison.OrdinalIgnoreCase) == true).Distinct())
        {
            if (!url!.StartsWith(Prefix, StringComparison.Ordinal) || !Guid.TryParseExact(url[Prefix.Length..], "N", out _))
                throw new ValidationAppException("Generated images must use their original asset path.");
            var id = url[Prefix.Length..];
            if (!await db.AiGenerations.AnyAsync(x => x.Id == id && x.UserId == userId && x.Kind == "number-peg-image" && x.Status == "completed" && x.ImageBytes != null, ct))
                throw new ValidationAppException("This generated image does not belong to you or is unavailable.");
        }
    }
}
