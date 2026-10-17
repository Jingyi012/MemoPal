namespace MemoPal.Application.Features.Companion.DTOs;

public sealed record CompanionMemoryDto(string Id, string Type, DateTime OccurredAt, string SummaryEn, string SummaryZh);
public sealed record CompanionLookDto(string? HeadwearId, string? BodywearId, string? BackwearId, string? HandItemId);

public sealed record CompanionDto(string? AvatarId, int BondPoints, string BondStage, int BondProgress,
    int BondToNextStage, int TodayPracticeCount, IReadOnlyList<CompanionMemoryDto> Memories, CompanionLookDto Look);
