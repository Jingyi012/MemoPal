using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Application.Features.MemorySets;
using MemoPal.Application.Features.MemorySets.Commands;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.MemoryBridge;

public sealed class EducationDerivedMemorySetCleanupHandler(IAppDbContext db)
    : INotificationHandler<MemorySetSoftDeletingNotification>
{
    public async Task Handle(MemorySetSoftDeletingNotification notification, CancellationToken ct)
    {
        var derivedRows = await db.EducationObjectiveDerivedMemorySets
            .Where(x => x.MemorySetId == notification.MemorySetId && !x.IsDeleted).ToListAsync(ct);
        if (derivedRows.Count == 0) return;
        var ids = derivedRows.Select(x => x.Id).ToArray();
        var maps = await db.EducationDerivedItemMaps.Where(x => ids.Contains(x.DerivedId) && !x.IsDeleted).ToListAsync(ct);
        db.EducationDerivedItemMaps.RemoveRange(maps);
        db.EducationObjectiveDerivedMemorySets.RemoveRange(derivedRows);
    }
}

public sealed record GetEducationMemoryBridgeStatusQuery(string UserId, string ObjectiveId)
    : IRequest<ApiResponse<EducationMemoryBridgeStatusDto>>;

public sealed class GetEducationMemoryBridgeStatusHandler(IAppDbContext db)
    : IRequestHandler<GetEducationMemoryBridgeStatusQuery, ApiResponse<EducationMemoryBridgeStatusDto>>
{
    public async Task<ApiResponse<EducationMemoryBridgeStatusDto>> Handle(GetEducationMemoryBridgeStatusQuery q, CancellationToken ct)
    {
        var (objective, sourceItems) = await EducationMemoryBridgeAccess.LoadAsync(db, q.UserId, q.ObjectiveId, ct);
        var derived = await db.EducationObjectiveDerivedMemorySets.AsNoTracking()
            .Where(x => x.ObjectiveId == objective.Id && x.OwnerUserId == q.UserId && !x.IsDeleted)
            .ToListAsync(ct);
        var sourceHash = EducationMemoryDerivationRules.SourceHash(objective, sourceItems);
        var statuses = new List<EducationDerivedMemoryStatusDto>();
        foreach (var row in derived)
        {
            var itemMaps = await db.EducationDerivedItemMaps.AsNoTracking()
                .Where(x => x.DerivedId == row.Id && !x.IsDeleted).ToListAsync(ct);
            var diff = EducationMemoryBridgeSync.Calculate(objective, sourceItems, itemMaps);
            statuses.Add(new(row.MemorySetId, row.TechniqueKey, row.SourceContentHash != sourceHash,
                diff.Added, diff.Modified, diff.Removed));
        }

        var type = objective.MemoryContentType;
        var fits = new[]
        {
            Fit(objective, sourceItems, type, MemoryTechniqueKeys.Palace),
            Fit(objective, sourceItems, type, MemoryTechniqueKeys.NumberPeg)
        };
        return ApiResponse<EducationMemoryBridgeStatusDto>.Ok(new(objective.Id, type.ToString(), sourceItems.Count,
            fits, statuses));
    }

    private static EducationMemoryTechniqueFitDto Fit(EducationObjective objective,
        IReadOnlyCollection<EducationObjectiveStudyItem> items, EducationMemoryContentType type, string technique)
    {
        if (!EducationMemoryDerivationRules.IsSupported(type))
            return new(technique, false, false, "NotSuitableForMemoryTechnique");
        try
        {
            EducationMemoryDerivationRules.ValidateCapacity(items.Count);
            foreach (var item in items) _ = EducationMemoryDerivationRules.Map(objective, item);
            var recommended = technique == MemoryTechniqueKeys.Palace
                ? type is EducationMemoryContentType.VocabularyPair or EducationMemoryContentType.LanguageItem or EducationMemoryContentType.VerbatimText
                : type is EducationMemoryContentType.OrderedList or EducationMemoryContentType.NumberDate;
            return new(technique, true, recommended, null);
        }
        catch (EducationMemoryDerivationRuleException ex)
        {
            return new(technique, false, false, ex.ReasonCode);
        }
    }
}

public sealed record DeriveEducationMemorySetCommand(string UserId, string ObjectiveId, string TechniqueKey)
    : IRequest<ApiResponse<DeriveEducationMemorySetDto>>;

public sealed class DeriveEducationMemorySetHandler(IAppDbContext db, IEducationMemoryBridgeLock bridgeLock)
    : IRequestHandler<DeriveEducationMemorySetCommand, ApiResponse<DeriveEducationMemorySetDto>>
{
    public Task<ApiResponse<DeriveEducationMemorySetDto>> Handle(DeriveEducationMemorySetCommand q, CancellationToken ct) =>
        db.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // Re-read the entire unit of work after a transient failure; no staged
            // positions or entities from a rolled-back attempt may be reused.
            db.ClearTracking();
            return await HandleAttempt(q, ct);
        });

    private async Task<ApiResponse<DeriveEducationMemorySetDto>> HandleAttempt(DeriveEducationMemorySetCommand q, CancellationToken ct)
    {
        var technique = EducationMemoryBridgeAccess.ValidateTechnique(q.TechniqueKey);
        using var requestLock = await bridgeLock.AcquireAsync($"derive:{q.UserId}:{q.ObjectiveId}:{technique}", ct);
        var (objective, sourceItems) = await EducationMemoryBridgeAccess.LoadAsync(db, q.UserId, q.ObjectiveId, ct);
        EducationMemoryBridgeAccess.ValidateSource(objective, sourceItems);

        var existing = await db.EducationObjectiveDerivedMemorySets.AsNoTracking().FirstOrDefaultAsync(x =>
            x.ObjectiveId == objective.Id && x.OwnerUserId == q.UserId && x.TechniqueKey == technique && !x.IsDeleted, ct);
        if (existing is not null)
            return ApiResponse<DeriveEducationMemorySetDto>.Ok(new(existing.MemorySetId, technique, true));

        var content = sourceItems.Select(item => EducationMemoryDerivationRules.Map(objective, item)).ToArray();
        var memoryItems = content.Select((item, index) => new MemoryItemInput
        {
            Position = index + 1,
            Prompt = item.Prompt,
            Answer = item.Answer,
            Hint = item.Hint
        }).ToArray();
        var now = DateTime.UtcNow;
        var request = new MemorySetUpsertRequest
        {
            Title = TruncateTitle(objective.Title),
            GoalType = objective.MemoryContentType switch
            {
                EducationMemoryContentType.OrderedList => MemoryGoalTypes.OrderedList,
                EducationMemoryContentType.LanguageItem => MemoryGoalTypes.Spelling,
                EducationMemoryContentType.VocabularyPair => MemoryGoalTypes.Spelling,
                _ => MemoryGoalTypes.Facts
            },
            TechniqueKey = technique,
            Status = MemorySetStatuses.Draft,
            Visibility = MemorySetVisibilities.Private,
            Items = memoryItems
        };
        var memorySet = await MemorySetCreation.BuildValidatedAsync(db, q.UserId, request, ct);
        var transaction = await db.BeginTransactionIfSupportedAsync(ct);
        db.MemorySets.Add(memorySet);
        var derived = new EducationObjectiveDerivedMemorySet
        {
            ObjectiveId = objective.Id,
            MemorySetId = memorySet.Id,
            OwnerUserId = q.UserId,
            TechniqueKey = technique,
            SourceContentHash = EducationMemoryDerivationRules.SourceHash(objective, sourceItems),
            SourceItemCount = sourceItems.Count,
            DerivedAtUtc = now,
            LastSyncedAtUtc = now
        };
        db.EducationObjectiveDerivedMemorySets.Add(derived);
        for (var i = 0; i < sourceItems.Count; i++)
        {
            var target = memorySet.Items.Single(x => x.Position == i + 1);
            db.EducationDerivedItemMaps.Add(new EducationDerivedItemMap
            {
                DerivedId = derived.Id,
                StudyItemId = sourceItems[i].Id,
                MemoryItemId = target.Id,
                LastSyncedContentHash = EducationMemoryDerivationRules.MappedContentHash(target.Prompt, target.Answer, target.Hint)
            });
        }
        try
        {
            await db.SaveChangesAsync(ct);
            if (transaction is not null) await transaction.CommitAsync(ct);
            return ApiResponse<DeriveEducationMemorySetDto>.Ok(new(memorySet.Id, technique, false));
        }
        catch (DbUpdateException exception) when (EducationMemoryBridgeConcurrency.IsUniqueConstraintViolation(exception))
        {
            if (transaction is not null)
            {
                await transaction.RollbackAsync(ct);
                await transaction.DisposeAsync();
                transaction = null;
            }
            db.ClearTracking();
            var winner = await db.EducationObjectiveDerivedMemorySets.AsNoTracking().FirstOrDefaultAsync(x =>
                x.ObjectiveId == objective.Id && x.OwnerUserId == q.UserId && x.TechniqueKey == technique && !x.IsDeleted, ct);
            if (winner is null) throw;
            return ApiResponse<DeriveEducationMemorySetDto>.Ok(new(winner.MemorySetId, technique, true));
        }
        finally
        {
            if (transaction is not null) await transaction.DisposeAsync();
        }
    }

    private static string TruncateTitle(string value)
    {
        var result = new System.Text.StringBuilder();
        foreach (var rune in value.Trim().EnumerateRunes())
        {
            if (result.Length + rune.Utf16SequenceLength > 200) break;
            result.Append(rune.ToString());
        }
        return result.ToString();
    }
}

public sealed record SyncEducationMemorySetCommand(string UserId, string ObjectiveId, string TechniqueKey)
    : IRequest<ApiResponse<SyncEducationMemorySetDto>>;

public sealed class SyncEducationMemorySetHandler(IAppDbContext db, IEducationMemoryBridgeLock bridgeLock)
    : IRequestHandler<SyncEducationMemorySetCommand, ApiResponse<SyncEducationMemorySetDto>>
{
    public Task<ApiResponse<SyncEducationMemorySetDto>> Handle(SyncEducationMemorySetCommand q, CancellationToken ct) =>
        db.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // Re-read the entire unit of work after a transient failure; no staged
            // positions or entities from a rolled-back attempt may be reused.
            db.ClearTracking();
            return await HandleAttempt(q, ct);
        });

    private async Task<ApiResponse<SyncEducationMemorySetDto>> HandleAttempt(SyncEducationMemorySetCommand q, CancellationToken ct)
    {
        var technique = EducationMemoryBridgeAccess.ValidateTechnique(q.TechniqueKey);
        using var requestLock = await bridgeLock.AcquireAsync($"sync:{q.UserId}:{q.ObjectiveId}:{technique}", ct);
        return await ApplySyncAsync(q, technique, ct, 0);
    }

    private async Task<ApiResponse<SyncEducationMemorySetDto>> ApplySyncAsync(
        SyncEducationMemorySetCommand q, string technique, CancellationToken ct, int retry)
    {
        var (objective, sourceItems) = await EducationMemoryBridgeAccess.LoadAsync(db, q.UserId, q.ObjectiveId, ct);
        var derived = await db.EducationObjectiveDerivedMemorySets.FirstOrDefaultAsync(x =>
            x.ObjectiveId == objective.Id && x.OwnerUserId == q.UserId && x.TechniqueKey == technique && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Derived memory set not found.");
        var memorySet = await db.MemorySets.FirstOrDefaultAsync(x => x.Id == derived.MemorySetId &&
            x.UserId == q.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Derived memory set not found.");
        var maps = await db.EducationDerivedItemMaps.Where(x => x.DerivedId == derived.Id && !x.IsDeleted).ToListAsync(ct);
        var bySource = maps.ToDictionary(x => x.StudyItemId, StringComparer.Ordinal);
        var currentById = sourceItems.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var memoryItems = await db.MemoryItems.Where(x => x.MemorySetId == memorySet.Id && !x.IsDeleted)
            .ToDictionaryAsync(x => x.Id, StringComparer.Ordinal, ct);
        var details = new List<EducationMemorySyncDetailDto>();
        var additions = sourceItems.Where(x => !bySource.ContainsKey(x.Id)).ToArray();
        var desiredCount = memoryItems.Count + additions.Length;
        if (desiredCount > 100)
            throw new EducationMemoryDerivationRuleException("MemorySetItemLimitExceeded", "Sync would exceed the 100 item limit.");

        var added = 0;
        var updated = 0;
        var skipped = 0;
        var removed = maps.Count(x => !currentById.ContainsKey(x.StudyItemId));
        foreach (var map in maps.Where(x => currentById.ContainsKey(x.StudyItemId)))
        {
            var source = currentById[map.StudyItemId];
            var mapped = EducationMemoryDerivationRules.Map(objective, source);
            var incomingHash = EducationMemoryDerivationRules.MappedContentHash(mapped.Prompt, mapped.Answer, mapped.Hint);
            if (incomingHash == map.LastSyncedContentHash) continue;
            if (!memoryItems.TryGetValue(map.MemoryItemId, out var target) ||
                EducationMemoryDerivationRules.MappedContentHash(target.Prompt, target.Answer, target.Hint) != map.LastSyncedContentHash)
            {
                skipped++;
                details.Add(new("skipped-user-edited", source.Id));
                continue;
            }
            target.Prompt = mapped.Prompt;
            target.Answer = mapped.Answer;
            target.Hint = mapped.Hint;
            map.LastSyncedContentHash = incomingHash;
            updated++;
            details.Add(new("updated", source.Id));
        }

        var nextPosition = memoryItems.Values.Select(x => x.Position).DefaultIfEmpty(0).Max();
        foreach (var source in additions)
        {
            var mapped = EducationMemoryDerivationRules.Map(objective, source);
            var target = new MemoryItem
            {
                MemorySetId = memorySet.Id,
                Position = ++nextPosition,
                Prompt = mapped.Prompt,
                Answer = mapped.Answer,
                Hint = mapped.Hint
            };
            db.MemoryItems.Add(target);
            db.EducationDerivedItemMaps.Add(new EducationDerivedItemMap
            {
                DerivedId = derived.Id,
                StudyItemId = source.Id,
                MemoryItemId = target.Id,
                LastSyncedContentHash = EducationMemoryDerivationRules.MappedContentHash(target.Prompt, target.Answer, target.Hint)
            });
            added++;
            details.Add(new("added", source.Id));
        }
        foreach (var map in maps.Where(x => !currentById.ContainsKey(x.StudyItemId)))
            details.Add(new("removed-from-course", map.StudyItemId));

        derived.SourceContentHash = EducationMemoryDerivationRules.SourceHash(objective, sourceItems);
        derived.SourceItemCount = sourceItems.Count;
        derived.LastSyncedAtUtc = DateTime.UtcNow;
        memorySet.Version++;
        var transaction = await db.BeginTransactionIfSupportedAsync(ct);
        try
        {
            await db.SaveChangesAsync(ct);
            if (transaction is not null) await transaction.CommitAsync(ct);
            return ApiResponse<SyncEducationMemorySetDto>.Ok(new(memorySet.Id, added, updated, skipped, removed, details));
        }
        catch (DbUpdateException exception) when (EducationMemoryBridgeConcurrency.IsUniqueConstraintViolation(exception) && retry < 2)
        {
            if (transaction is not null)
            {
                await transaction.RollbackAsync(ct);
                await transaction.DisposeAsync();
                transaction = null;
            }
            db.ClearTracking();
            return await ApplySyncAsync(q, technique, ct, retry + 1);
        }
        finally
        {
            if (transaction is not null) await transaction.DisposeAsync();
        }
    }
}

internal static class EducationMemoryBridgeConcurrency
{
    public static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        // Keep the Application layer independent of Npgsql while recognizing PostgreSQL's
        // unique-violation SQLSTATE. Other persistence failures must continue to surface.
        for (var cause = exception.InnerException; cause is not null; cause = cause.InnerException)
        {
            var type = cause.GetType();
            if (type.FullName != "Npgsql.PostgresException") continue;
            if (string.Equals(type.GetProperty("SqlState")?.GetValue(cause)?.ToString(), "23505", StringComparison.Ordinal))
                return true;
        }
        return false;
    }
}

internal static class EducationMemoryBridgeAccess
{
    public static async Task<(EducationObjective Objective, List<EducationObjectiveStudyItem> Items)> LoadAsync(
        IAppDbContext db, string userId, string objectiveId, CancellationToken ct)
    {
        var objective = await db.EducationObjectives.AsNoTracking().Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == objectiveId && !x.IsDeleted && x.Course != null && !x.Course.IsDeleted, ct)
            ?? throw new NotFoundAppException("Study content not found.");
        await EducationLearnerReadPolicy.RequireReadAsync(db, userId, objective.Course!, ct);
        var items = await db.EducationObjectiveStudyItems.Where(x => x.ObjectiveId == objective.Id && !x.IsDeleted &&
            x.Status == EducationStudyItemStatus.Published).OrderBy(x => x.Position).ToListAsync(ct);
        return (objective, items);
    }

    public static string ValidateTechnique(string techniqueKey)
    {
        if (!MemoryTechniqueKeys.All.Contains(techniqueKey))
            throw new EducationMemoryDerivationRuleException("UnsupportedTechnique", "The selected memory technique is not supported.");
        return techniqueKey;
    }

    public static void ValidateSource(EducationObjective objective, IReadOnlyCollection<EducationObjectiveStudyItem> items)
    {
        if (!EducationMemoryDerivationRules.IsSupported(objective.MemoryContentType))
            throw new EducationMemoryDerivationRuleException("NotSuitableForMemoryTechnique", "This learning objective is not suitable for a memory technique.");
        EducationMemoryDerivationRules.ValidateCapacity(items.Count);
        foreach (var item in items) _ = EducationMemoryDerivationRules.Map(objective, item);
    }
}

internal static class EducationMemoryBridgeSync
{
    public sealed record Diff(int Added, int Modified, int Removed);

    public static Diff Calculate(EducationObjective objective,
        IReadOnlyCollection<EducationObjectiveStudyItem> sourceItems, IReadOnlyCollection<EducationDerivedItemMap> maps)
    {
        var current = sourceItems.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var mapBySource = maps.ToDictionary(x => x.StudyItemId, StringComparer.Ordinal);
        var modified = 0;
        foreach (var map in maps.Where(x => current.ContainsKey(x.StudyItemId)))
        {
            var item = current[map.StudyItemId];
            var mapped = EducationMemoryDerivationRules.Map(objective, item);
            if (EducationMemoryDerivationRules.MappedContentHash(mapped.Prompt, mapped.Answer, mapped.Hint) != map.LastSyncedContentHash)
                modified++;
        }
        return new Diff(sourceItems.Count(x => !mapBySource.ContainsKey(x.Id)), modified,
            maps.Count(x => !current.ContainsKey(x.StudyItemId)));
    }
}
