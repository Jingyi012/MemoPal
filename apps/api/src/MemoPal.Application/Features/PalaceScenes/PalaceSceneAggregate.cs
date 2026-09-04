using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Media;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.PalaceScenes;

internal static class PalaceSceneAggregate
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.Ordinal)
    {
        PalaceSceneStatuses.Draft,
        PalaceSceneStatuses.Published,
        PalaceSceneStatuses.Archived
    };

    public static void Validate(PalaceSceneUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 200)
            throw new ValidationAppException("A Palace scene name between 1 and 200 characters is required.");
        if (string.IsNullOrWhiteSpace(request.ImageUrl))
            throw new ValidationAppException("A Palace scene image is required.");
        if (!AllowedStatuses.Contains(request.Status))
            throw new ValidationAppException("The Palace scene status is invalid.");
        if (request.Status == PalaceSceneStatuses.Published && request.Loci.Count == 0)
            throw new ValidationAppException("Add at least one locus before publishing a Palace scene.");

        var positions = new HashSet<int>();
        foreach (var locus in request.Loci)
        {
            if (locus.Position < 1 || !positions.Add(locus.Position))
                throw new ValidationAppException("Locus positions must be unique positive numbers.");
            if (string.IsNullOrWhiteSpace(locus.Name) || locus.Name.Trim().Length > 100)
                throw new ValidationAppException($"Locus {locus.Position} needs a short name.");
            ValidateOptionalLength(locus.NameEn, 100, $"Locus {locus.Position} English name");
            ValidateOptionalLength(locus.NameZh, 100, $"Locus {locus.Position} Chinese name");
            ValidateOptionalLength(locus.Description, 500, $"Locus {locus.Position} description");
            ValidateOptionalLength(locus.DescriptionEn, 500, $"Locus {locus.Position} English description");
            ValidateOptionalLength(locus.DescriptionZh, 500, $"Locus {locus.Position} Chinese description");
            if (locus.XPercent is < 0 or > 100 || locus.YPercent is < 0 or > 100)
                throw new ValidationAppException("Locus coordinates must stay between 0 and 100 percent.");
            if (locus.RadiusPercent is < 2 or > 25)
                throw new ValidationAppException("Locus radius must stay between 2 and 25 percent.");
        }
    }

    public static PalaceScene Create(PalaceSceneUpsertRequest request)
    {
        Validate(request);
        var scene = new PalaceScene { IsTemplate = true, Version = 1 };
        Apply(scene, request, isTemplate: true);
        foreach (var input in request.Loci) scene.Loci.Add(CreateLocus(scene.Id, input));
        return scene;
    }

    public static PalaceScene CreateCustom(string userId, PalaceSceneUpsertRequest request)
    {
        Validate(request);
        var scene = new PalaceScene
        {
            IsTemplate = false,
            UserId = userId,
            Version = 1,
        };
        Apply(scene, request, isTemplate: false);
        foreach (var input in request.Loci) scene.Loci.Add(CreateLocus(scene.Id, input));
        return scene;
    }

    public static void Update(PalaceScene scene, PalaceSceneUpsertRequest request)
    {
        Validate(request);
        Apply(scene, request, isTemplate: true);
        var requestedIds = request.Loci.Where(x => !string.IsNullOrWhiteSpace(x.Id)).Select(x => x.Id!).ToHashSet();
        foreach (var locus in scene.Loci.Where(x => !x.IsDeleted && !requestedIds.Contains(x.Id)))
        {
            locus.IsDeleted = true;
            locus.DeletedAt = DateTime.UtcNow;
        }

        var existing = scene.Loci.Where(x => !x.IsDeleted).ToDictionary(x => x.Id);
        foreach (var input in request.Loci)
        {
            if (string.IsNullOrWhiteSpace(input.Id))
            {
                scene.Loci.Add(CreateLocus(scene.Id, input));
                continue;
            }
            if (!existing.TryGetValue(input.Id, out var locus))
                throw new ValidationAppException("A submitted locus does not belong to this scene.");
            ApplyLocus(locus, input);
        }
        scene.Version += 1;
    }

    public static void UpdateCustom(PalaceScene scene, PalaceSceneUpsertRequest request)
    {
        Validate(request);
        Apply(scene, request, isTemplate: false);
        var requestedIds = request.Loci
            .Where(x => !string.IsNullOrWhiteSpace(x.Id))
            .Select(x => x.Id!)
            .ToHashSet();
        foreach (var locus in scene.Loci.Where(x => !x.IsDeleted && !requestedIds.Contains(x.Id)))
        {
            locus.IsDeleted = true;
            locus.DeletedAt = DateTime.UtcNow;
        }

        var existing = scene.Loci.Where(x => !x.IsDeleted).ToDictionary(x => x.Id);
        foreach (var input in request.Loci)
        {
            if (string.IsNullOrWhiteSpace(input.Id))
            {
                scene.Loci.Add(CreateLocus(scene.Id, input));
                continue;
            }
            if (!existing.TryGetValue(input.Id, out var locus))
                throw new ValidationAppException("A submitted locus does not belong to this Palace.");
            ApplyLocus(locus, input);
        }
        scene.Version += 1;
    }

    private static void Apply(PalaceScene scene, PalaceSceneUpsertRequest request, bool isTemplate)
    {
        scene.Name = request.Name.Trim();
        scene.Description = request.Description.Trim();
        scene.ImageUrl = MediaPathNormalizer.Normalize(request.ImageUrl);
        scene.Status = request.Status;
        scene.IsPremium = request.IsPremium;
        scene.IsTemplate = isTemplate;
    }

    private static PalaceLocus CreateLocus(string sceneId, PalaceLocusInput input)
    {
        var locus = new PalaceLocus { PalaceSceneId = sceneId };
        ApplyLocus(locus, input);
        return locus;
    }

    private static void ApplyLocus(PalaceLocus locus, PalaceLocusInput input)
    {
        locus.Position = input.Position;
        locus.Name = input.Name.Trim();
        locus.Description = string.IsNullOrWhiteSpace(input.Description) ? null : input.Description.Trim();
        locus.NameEn = NormalizeOptional(input.NameEn);
        locus.NameZh = NormalizeOptional(input.NameZh);
        locus.DescriptionEn = NormalizeOptional(input.DescriptionEn);
        locus.DescriptionZh = NormalizeOptional(input.DescriptionZh);
        locus.XPercent = input.XPercent;
        locus.YPercent = input.YPercent;
        locus.RadiusPercent = input.RadiusPercent;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void ValidateOptionalLength(string? value, int maxLength, string label)
    {
        if (!string.IsNullOrWhiteSpace(value) && value.Trim().Length > maxLength)
            throw new ValidationAppException($"{label} must be {maxLength} characters or fewer.");
    }
}
