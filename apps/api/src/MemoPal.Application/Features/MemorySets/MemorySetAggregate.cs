using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;
using System.Text.Json;

namespace MemoPal.Application.Features.MemorySets;

internal static class MemorySetAggregate
{
    public static void Validate(MemorySetUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationAppException("A memory set title is required.");
        }

        if (request.Title.Trim().Length > 200)
        {
            throw new ValidationAppException("A memory set title cannot exceed 200 characters.");
        }

        if (!MemoryGoalTypes.All.Contains(request.GoalType))
        {
            throw new ValidationAppException("The selected memory goal is not supported.");
        }

        if (!MemoryTechniqueKeys.All.Contains(request.TechniqueKey))
        {
            throw new ValidationAppException("The selected memory technique is not supported.");
        }

        if (!MemorySetStatuses.All.Contains(request.Status))
        {
            throw new ValidationAppException("The selected memory set status is not supported.");
        }

        if (!MemorySetVisibilities.All.Contains(request.Visibility))
        {
            throw new ValidationAppException("The selected visibility is not supported.");
        }

        if (request.Items.Count > 100)
        {
            throw new ValidationAppException("A memory set cannot contain more than 100 items.");
        }

        var positions = new HashSet<int>();
        foreach (var item in request.Items)
        {
            if (item.Position < 1 || !positions.Add(item.Position))
            {
                throw new ValidationAppException("Memory item positions must be unique positive numbers.");
            }

            if (string.IsNullOrWhiteSpace(item.Answer))
            {
                throw new ValidationAppException($"Memory item {item.Position} requires an answer.");
            }

            if (item.Answer.Trim().Length > 500 || item.Prompt.Trim().Length > 500)
            {
                throw new ValidationAppException("Memory item prompts and answers cannot exceed 500 characters.");
            }
        }

        var isDraft = request.Status == MemorySetStatuses.Draft;
        if (!isDraft && request.Items.Count == 0)
        {
            throw new ValidationAppException("Add at least one item before starting a memory set.");
        }

        if (request.TechniqueKey == MemoryTechniqueKeys.NumberPeg && request.Items.Count > 100)
        {
            throw new ValidationAppException("Number Peg supports up to 100 items. Split longer sets into multiple memories.");
        }

        if (isDraft && request.TechniquePlan is null)
        {
            return;
        }

        if (request.TechniquePlan is null)
        {
            throw new ValidationAppException("A technique plan is required before starting practice.");
        }

        if (request.TechniquePlan.SchemaVersion < 1)
        {
            throw new ValidationAppException("Technique plan schema version must be at least 1.");
        }

        if (request.TechniqueKey == MemoryTechniqueKeys.NumberPeg)
        {
            ValidatePegPlan(request, positions, isDraft);
        }
        else
        {
            ValidatePalacePlan(request, positions, isDraft);
        }
    }

    private static void ValidatePegPlan(
        MemorySetUpsertRequest request,
        IReadOnlySet<int> itemPositions,
        bool isDraft)
    {
        var bindings = request.TechniquePlan!.PegBindings;
        if (request.TechniquePlan.PalaceBindings.Count > 0)
        {
            throw new ValidationAppException("A Number Peg plan cannot contain Palace bindings.");
        }

        var boundItems = new HashSet<int>();
        var pegNumbers = new HashSet<int>();
        foreach (var binding in bindings)
        {
            if (!itemPositions.Contains(binding.ItemPosition) || !boundItems.Add(binding.ItemPosition))
            {
                throw new ValidationAppException("Each Peg binding must reference one unique memory item.");
            }

            if (binding.PegNumber is < 1 or > 100 || !pegNumbers.Add(binding.PegNumber))
            {
                throw new ValidationAppException("Peg numbers must be unique values from 1 to 100.");
            }

            if (string.IsNullOrWhiteSpace(binding.SceneText))
            {
                throw new ValidationAppException($"Peg {binding.PegNumber} needs a vivid scene.");
            }

            ValidateSceneRecipe(binding.SceneRecipe, binding.PegNumber);
        }

        if (!isDraft && bindings.Count != itemPositions.Count)
        {
            throw new ValidationAppException("Build one Peg scene for every memory item before practicing.");
        }
    }

    private static void ValidatePalacePlan(
        MemorySetUpsertRequest request,
        IReadOnlySet<int> itemPositions,
        bool isDraft)
    {
        var bindings = request.TechniquePlan!.PalaceBindings;
        if (string.IsNullOrWhiteSpace(request.TechniquePlan.PalaceSceneId))
        {
            throw new ValidationAppException("Choose a Palace scene before placing memory items.");
        }

        if (request.TechniquePlan.PegBindings.Count > 0)
        {
            throw new ValidationAppException("A Memory Palace plan cannot contain Peg bindings.");
        }

        var boundItems = new HashSet<int>();
        var loci = new HashSet<string>(StringComparer.Ordinal);
        foreach (var binding in bindings)
        {
            if (!itemPositions.Contains(binding.ItemPosition) || !boundItems.Add(binding.ItemPosition))
            {
                throw new ValidationAppException("Each Palace binding must reference one unique memory item.");
            }

            if (string.IsNullOrWhiteSpace(binding.LocusId) || !loci.Add(binding.LocusId))
            {
                throw new ValidationAppException("Each Palace binding needs one unique locus.");
            }

            if (string.IsNullOrWhiteSpace(binding.AssociationText))
            {
                throw new ValidationAppException("Each Palace locus needs a memorable association.");
            }
        }

        if (!isDraft && bindings.Count != itemPositions.Count)
        {
            throw new ValidationAppException("Place every memory item at a locus before practicing.");
        }
    }

    public static MemorySet Create(string userId, MemorySetUpsertRequest request)
    {
        Validate(request);

        var entity = new MemorySet
        {
            UserId = userId,
            MemoryFolderId = request.MemoryFolderId,
            Version = 1
        };

        ApplyScalarValues(entity, request);
        ApplyItemsAndPlan(entity, request);
        return entity;
    }

    private static void ValidateSceneRecipe(PegSceneRecipeDto? recipe, int pegNumber)
    {
        if (recipe is null) return;
        if (recipe.SchemaVersion != 1)
            throw new ValidationAppException($"Peg {pegNumber} has an unsupported scene recipe version.");
        if (string.IsNullOrWhiteSpace(recipe.Caption) || recipe.Caption.Trim().Length > 1000)
            throw new ValidationAppException($"Peg {pegNumber} needs a readable scene caption.");
        if (!new[] { "suggested", "customized", "user-written" }.Contains(recipe.AssociationSource, StringComparer.Ordinal))
            throw new ValidationAppException($"Peg {pegNumber} has an unsupported scene source.");
        var actions = new[] { "crash", "bounce", "wrap", "explode", "melt", "chase", "swallow", "stretch", "spin", "launch" };
        if (!actions.Contains(recipe.ActionPreset, StringComparer.Ordinal))
            throw new ValidationAppException($"Peg {pegNumber} has an unsupported scene action.");
        if (recipe.VisualEffectPreset is not null && !actions.Contains(recipe.VisualEffectPreset, StringComparer.Ordinal))
            throw new ValidationAppException($"Peg {pegNumber} has an unsupported visual effect.");
        if (recipe.SoundPreset is not null && !new[] { "complete", "correct", "wrong" }.Contains(recipe.SoundPreset, StringComparer.Ordinal))
            throw new ValidationAppException($"Peg {pegNumber} has an unsupported sound preset.");
        if (recipe.HapticPreset is not null && !new[] { "impact", "success" }.Contains(recipe.HapticPreset, StringComparer.Ordinal))
            throw new ValidationAppException($"Peg {pegNumber} has an unsupported haptic preset.");
        if (recipe.SensoryBoosters is null || recipe.SensoryBoosters.Count > 1)
            throw new ValidationAppException($"Peg {pegNumber} can have at most one sensory booster.");
        if (recipe.SensoryBoosters.Any(string.IsNullOrWhiteSpace) || recipe.SensoryBoosters.Any(x => x.Length > 32))
            throw new ValidationAppException($"Peg {pegNumber} has an invalid sensory booster.");
        if (recipe.TargetVisual is not null && (!new[] { "emoji", "sticker", "word" }.Contains(recipe.TargetVisual.Kind, StringComparer.Ordinal) || string.IsNullOrWhiteSpace(recipe.TargetVisual.Value) || recipe.TargetVisual.Value.Length > 500))
            throw new ValidationAppException($"Peg {pegNumber} has an invalid target visual.");
        if (recipe.AnchorSnapshot is not null &&
            (recipe.AnchorSnapshot.PegNumber != pegNumber ||
             string.IsNullOrWhiteSpace(recipe.AnchorSnapshot.CatalogueVersion) || recipe.AnchorSnapshot.CatalogueVersion.Length > 100 ||
             string.IsNullOrWhiteSpace(recipe.AnchorSnapshot.Keyword) || recipe.AnchorSnapshot.Keyword.Length > 200 ||
             string.IsNullOrWhiteSpace(recipe.AnchorSnapshot.Image) || recipe.AnchorSnapshot.Image.Length > 2048 ||
             string.IsNullOrWhiteSpace(recipe.AnchorSnapshot.Description) || recipe.AnchorSnapshot.Description.Length > 500))
            throw new ValidationAppException($"Peg {pegNumber} has an invalid anchor snapshot.");
        if (JsonSerializer.Serialize(recipe).Length > 8000)
            throw new ValidationAppException($"Peg {pegNumber} scene recipe is too large.");
    }

    public static MemorySetUpsertRequest CreateDuplicateRequest(MemorySet source)
    {
        const string copySuffix = " (copy)";
        var sourceTitle = source.Title.Trim();
        var copyTitle = $"{sourceTitle[..Math.Min(sourceTitle.Length, 200 - copySuffix.Length)]}{copySuffix}";
        var items = source.Items
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Position)
            .ToList();
        var itemPositions = items.ToDictionary(x => x.Id, x => x.Position);

        var request = new MemorySetUpsertRequest
        {
            MemoryFolderId = source.MemoryFolderId,
            Title = copyTitle,
            Description = source.Description,
            GoalType = source.GoalType,
            TechniqueKey = source.TechniqueKey,
            Status = source.Status == MemorySetStatuses.Archived
                ? MemorySetStatuses.Draft
                : source.Status,
            Visibility = MemorySetVisibilities.Private,
            Items = items.Select(x => new MemoryItemInput
            {
                Position = x.Position,
                Prompt = x.Prompt,
                Answer = x.Answer,
                Hint = x.Hint,
                PronunciationAudioUrl = x.PronunciationAudioUrl
            }).ToList(),
            TechniquePlan = source.TechniquePlan is null || source.TechniquePlan.IsDeleted
                ? null
                : new TechniquePlanInput
                {
                    SchemaVersion = source.TechniquePlan.SchemaVersion,
                    PalaceSceneId = source.TechniquePlan.PalaceSceneId,
                    PegBindings = source.TechniquePlan.PegBindings
                        .Where(x => !x.IsDeleted && itemPositions.ContainsKey(x.MemoryItemId))
                        .Select(x => new PegBindingInput
                        {
                            ItemPosition = itemPositions[x.MemoryItemId],
                            PegNumber = x.PegNumber,
                            SceneText = x.SceneText,
                            SceneRecipe = DeserializeRecipe(x.SceneRecipeJson),
                            IsCustomScene = x.IsCustomScene,
                            SceneAssetUrl = x.SceneAssetUrl
                        }).ToList(),
                    PalaceBindings = source.TechniquePlan.PalaceBindings
                        .Where(x => !x.IsDeleted && itemPositions.ContainsKey(x.MemoryItemId))
                        .Select(x => new PalaceBindingInput
                        {
                            ItemPosition = itemPositions[x.MemoryItemId],
                            LocusId = x.LocusId,
                            AssociationText = x.AssociationText,
                            IsCustomScene = x.IsCustomScene,
                            SceneAssetUrl = x.SceneAssetUrl
                        }).ToList()
                }
        };

        if (source.Status == MemorySetStatuses.Archived)
        {
            request.Status = MemorySetStatuses.Ready;
            try
            {
                Validate(request);
            }
            catch (ValidationAppException)
            {
                request.Status = MemorySetStatuses.Draft;
            }
        }

        return request;
    }

    public static void Update(MemorySet entity, MemorySetUpsertRequest request)
    {
        Validate(request);
        ApplyScalarValues(entity, request);
        ReconcileItems(entity, request);
        ReconcilePlan(entity, request);
        entity.Version += 1;
    }

    public static MemorySetDto ToDto(MemorySet entity)
    {
        var items = entity.Items
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Position)
            .Select(x => new MemoryItemDto(
                x.Id,
                x.Position,
                x.Prompt,
                x.Answer,
                x.Hint,
                x.PronunciationAudioUrl,
                x.CreatedAt,
                x.CreatedBy,
                x.UpdatedAt,
                x.UpdatedBy))
            .ToList();

        var plan = entity.TechniquePlan is null || entity.TechniquePlan.IsDeleted
            ? null
            : new TechniquePlanDto(
                entity.TechniquePlan.Id,
                entity.TechniquePlan.TechniqueKey,
                entity.TechniquePlan.SchemaVersion,
                entity.TechniquePlan.PalaceSceneId,
                entity.TechniquePlan.PegBindings
                    .Where(x => !x.IsDeleted)
                    .OrderBy(x => x.PegNumber)
                    .Select(x => new PegBindingDto(
                        x.Id,
                        x.MemoryItemId,
                        x.PegNumber,
                        x.SceneText,
                        DeserializeRecipe(x.SceneRecipeJson),
                        x.IsCustomScene,
                        x.SceneAssetUrl,
                        x.CreatedAt,
                        x.CreatedBy,
                        x.UpdatedAt,
                        x.UpdatedBy))
                    .ToList(),
                entity.TechniquePlan.PalaceBindings
                    .Where(x => !x.IsDeleted)
                    .OrderBy(x => items.FindIndex(item => item.Id == x.MemoryItemId))
                    .Select(x => new PalaceBindingDto(
                        x.Id,
                        x.MemoryItemId,
                        x.LocusId,
                        x.AssociationText,
                        x.IsCustomScene,
                        x.SceneAssetUrl,
                        x.CreatedAt,
                        x.CreatedBy,
                        x.UpdatedAt,
                        x.UpdatedBy))
                    .ToList(),
                entity.TechniquePlan.CreatedAt,
                entity.TechniquePlan.CreatedBy,
                entity.TechniquePlan.UpdatedAt,
                entity.TechniquePlan.UpdatedBy);

        return new MemorySetDto(
            entity.Id,
            entity.Title,
            entity.Description,
            entity.GoalType,
            entity.TechniqueKey,
            entity.Status,
            entity.Visibility,
            entity.MemoryFolderId,
            entity.Version,
            items,
            plan,
            entity.CreatedAt,
            entity.CreatedBy,
            entity.UpdatedAt,
            entity.UpdatedBy);
    }

    private static void ApplyScalarValues(MemorySet entity, MemorySetUpsertRequest request)
    {
        entity.Title = request.Title.Trim();
        entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        entity.GoalType = request.GoalType;
        entity.TechniqueKey = request.TechniqueKey;
        entity.Status = request.Status;
        entity.Visibility = request.Visibility;
    }

    private static void ApplyItemsAndPlan(MemorySet entity, MemorySetUpsertRequest request)
    {
        var itemsByPosition = request.Items.ToDictionary(
            x => x.Position,
            x => CreateItem(entity.Id, x));
        entity.Items = itemsByPosition.Values.ToList();

        if (request.TechniquePlan is null)
        {
            return;
        }

        entity.TechniquePlan = CreatePlan(entity.Id, request, itemsByPosition);
    }

    private static void ReconcileItems(MemorySet entity, MemorySetUpsertRequest request)
    {
        var requestedPositions = request.Items.Select(x => x.Position).ToHashSet();
        foreach (var removed in entity.Items.Where(x => !x.IsDeleted && !requestedPositions.Contains(x.Position)))
        {
            removed.IsDeleted = true;
            removed.DeletedAt = DateTime.UtcNow;
        }

        var activeByPosition = entity.Items
            .Where(x => !x.IsDeleted)
            .ToDictionary(x => x.Position);

        foreach (var input in request.Items)
        {
            if (!activeByPosition.TryGetValue(input.Position, out var item))
            {
                item = CreateItem(entity.Id, input);
                entity.Items.Add(item);
                activeByPosition[input.Position] = item;
            }
            else
            {
                ApplyItemValues(item, input);
            }
        }
    }

    private static void ReconcilePlan(MemorySet entity, MemorySetUpsertRequest request)
    {
        if (request.TechniquePlan is null)
        {
            if (entity.TechniquePlan is not null)
            {
                entity.TechniquePlan.IsDeleted = true;
                entity.TechniquePlan.DeletedAt = DateTime.UtcNow;
            }
            return;
        }

        var itemsByPosition = entity.Items
            .Where(x => !x.IsDeleted)
            .ToDictionary(x => x.Position);

        var plan = entity.TechniquePlan;
        if (plan is null || plan.IsDeleted)
        {
            entity.TechniquePlan = CreatePlan(entity.Id, request, itemsByPosition);
            return;
        }

        plan.TechniqueKey = request.TechniqueKey;
        plan.SchemaVersion = request.TechniquePlan.SchemaVersion;
        plan.PalaceSceneId = request.TechniqueKey == MemoryTechniqueKeys.Palace
            ? request.TechniquePlan.PalaceSceneId
            : null;
        if (request.TechniqueKey == MemoryTechniqueKeys.NumberPeg)
        {
            ReconcilePegBindings(plan, request, itemsByPosition);
        }
        else
        {
            ReconcilePalaceBindings(plan, request, itemsByPosition);
        }
    }

    private static MemoryItem CreateItem(string memorySetId, MemoryItemInput input)
    {
        var item = new MemoryItem
        {
            MemorySetId = memorySetId
        };
        ApplyItemValues(item, input);
        return item;
    }

    private static void ApplyItemValues(MemoryItem item, MemoryItemInput input)
    {
        item.Position = input.Position;
        item.Prompt = string.IsNullOrWhiteSpace(input.Prompt) ? input.Answer.Trim() : input.Prompt.Trim();
        item.Answer = input.Answer.Trim();
        item.Hint = string.IsNullOrWhiteSpace(input.Hint) ? null : input.Hint.Trim();
        item.PronunciationAudioUrl = string.IsNullOrWhiteSpace(input.PronunciationAudioUrl)
            ? null
            : input.PronunciationAudioUrl.Trim();
        item.NormalizedAnswer = NormalizeAnswer(input.Answer);
    }

    private static TechniquePlan CreatePlan(
        string memorySetId,
        MemorySetUpsertRequest request,
        IReadOnlyDictionary<int, MemoryItem> itemsByPosition)
    {
        var plan = new TechniquePlan
        {
            MemorySetId = memorySetId,
            PalaceSceneId = request.TechniqueKey == MemoryTechniqueKeys.Palace
                ? request.TechniquePlan!.PalaceSceneId
                : null,
            TechniqueKey = request.TechniqueKey,
            SchemaVersion = request.TechniquePlan!.SchemaVersion
        };

        foreach (var input in request.TechniquePlan.PegBindings)
        {
            plan.PegBindings.Add(CreatePegBinding(plan.Id, itemsByPosition[input.ItemPosition].Id, input));
        }

        foreach (var input in request.TechniquePlan.PalaceBindings)
        {
            plan.PalaceBindings.Add(CreatePalaceBinding(plan.Id, itemsByPosition[input.ItemPosition].Id, input));
        }

        return plan;
    }

    private static void ReconcilePegBindings(
        TechniquePlan plan,
        MemorySetUpsertRequest request,
        IReadOnlyDictionary<int, MemoryItem> itemsByPosition)
    {
        var requestedItemIds = request.TechniquePlan!.PegBindings
            .Select(x => itemsByPosition[x.ItemPosition].Id)
            .ToHashSet(StringComparer.Ordinal);

        foreach (var removed in plan.PegBindings.Where(x => !x.IsDeleted && !requestedItemIds.Contains(x.MemoryItemId)))
        {
            removed.IsDeleted = true;
            removed.DeletedAt = DateTime.UtcNow;
        }

        var activeByItemId = plan.PegBindings
            .Where(x => !x.IsDeleted)
            .ToDictionary(x => x.MemoryItemId, StringComparer.Ordinal);

        foreach (var input in request.TechniquePlan.PegBindings)
        {
            var itemId = itemsByPosition[input.ItemPosition].Id;
            if (!activeByItemId.TryGetValue(itemId, out var binding))
            {
                plan.PegBindings.Add(CreatePegBinding(plan.Id, itemId, input));
            }
            else
            {
                ApplyPegBindingValues(binding, input);
            }
        }

        foreach (var oldPalaceBinding in plan.PalaceBindings.Where(x => !x.IsDeleted))
        {
            oldPalaceBinding.IsDeleted = true;
            oldPalaceBinding.DeletedAt = DateTime.UtcNow;
        }
    }

    private static void ReconcilePalaceBindings(
        TechniquePlan plan,
        MemorySetUpsertRequest request,
        IReadOnlyDictionary<int, MemoryItem> itemsByPosition)
    {
        var requestedItemIds = request.TechniquePlan!.PalaceBindings
            .Select(x => itemsByPosition[x.ItemPosition].Id)
            .ToHashSet(StringComparer.Ordinal);

        foreach (var removed in plan.PalaceBindings.Where(x => !x.IsDeleted && !requestedItemIds.Contains(x.MemoryItemId)))
        {
            removed.IsDeleted = true;
            removed.DeletedAt = DateTime.UtcNow;
        }

        var activeByItemId = plan.PalaceBindings
            .Where(x => !x.IsDeleted)
            .ToDictionary(x => x.MemoryItemId, StringComparer.Ordinal);

        foreach (var input in request.TechniquePlan.PalaceBindings)
        {
            var itemId = itemsByPosition[input.ItemPosition].Id;
            if (!activeByItemId.TryGetValue(itemId, out var binding))
            {
                plan.PalaceBindings.Add(CreatePalaceBinding(plan.Id, itemId, input));
            }
            else
            {
                ApplyPalaceBindingValues(binding, input);
            }
        }

        foreach (var oldPegBinding in plan.PegBindings.Where(x => !x.IsDeleted))
        {
            oldPegBinding.IsDeleted = true;
            oldPegBinding.DeletedAt = DateTime.UtcNow;
        }
    }

    private static PegBinding CreatePegBinding(string planId, string itemId, PegBindingInput input)
    {
        var binding = new PegBinding
        {
            TechniquePlanId = planId,
            MemoryItemId = itemId
        };
        ApplyPegBindingValues(binding, input);
        return binding;
    }

    private static void ApplyPegBindingValues(PegBinding binding, PegBindingInput input)
    {
        binding.PegNumber = input.PegNumber;
        binding.SceneText = input.SceneText.Trim();
        binding.SceneRecipeJson = input.SceneRecipe is null ? null : JsonSerializer.Serialize(input.SceneRecipe);
        binding.IsCustomScene = input.IsCustomScene;
        binding.SceneAssetUrl = string.IsNullOrWhiteSpace(input.SceneAssetUrl) ? null : input.SceneAssetUrl.Trim();
    }

    private static PegSceneRecipeDto? DeserializeRecipe(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        try { return JsonSerializer.Deserialize<PegSceneRecipeDto>(value); }
        catch (JsonException) { return null; }
    }

    private static PalaceBinding CreatePalaceBinding(string planId, string itemId, PalaceBindingInput input)
    {
        var binding = new PalaceBinding
        {
            TechniquePlanId = planId,
            MemoryItemId = itemId
        };
        ApplyPalaceBindingValues(binding, input);
        return binding;
    }

    private static void ApplyPalaceBindingValues(PalaceBinding binding, PalaceBindingInput input)
    {
        binding.LocusId = input.LocusId.Trim();
        binding.AssociationText = input.AssociationText.Trim();
        binding.IsCustomScene = input.IsCustomScene;
        binding.SceneAssetUrl = string.IsNullOrWhiteSpace(input.SceneAssetUrl) ? null : input.SceneAssetUrl.Trim();
    }

    private static string NormalizeAnswer(string value)
    {
        return string.Join(' ', value.Trim().ToUpperInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }
}
