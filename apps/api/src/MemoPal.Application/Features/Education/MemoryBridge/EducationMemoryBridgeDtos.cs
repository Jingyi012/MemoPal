namespace MemoPal.Application.Features.Education.MemoryBridge;

public sealed record EducationMemoryTechniqueFitDto(string TechniqueKey, bool IsAllowed, bool IsRecommended, string? ReasonCode);
public sealed record EducationDerivedMemoryStatusDto(string MemorySetId, string TechniqueKey, bool IsOutdated,
    int AddedCount, int ModifiedCount, int RemovedCount);
public sealed record EducationMemoryBridgeStatusDto(string ObjectiveId, string MemoryContentType,
    int PublishedItemCount, IReadOnlyList<EducationMemoryTechniqueFitDto> Techniques,
    IReadOnlyList<EducationDerivedMemoryStatusDto> DerivedSets);
public sealed record DeriveEducationMemorySetRequest(string TechniqueKey);
public sealed record DeriveEducationMemorySetDto(string MemorySetId, string TechniqueKey, bool AlreadyExisted);
public sealed record EducationMemorySyncDetailDto(string Status, string? StudyItemId = null);
public sealed record SyncEducationMemorySetDto(string MemorySetId, int AddedCount, int UpdatedCount,
    int SkippedCount, int RemovedCount, IReadOnlyList<EducationMemorySyncDetailDto> Details);
