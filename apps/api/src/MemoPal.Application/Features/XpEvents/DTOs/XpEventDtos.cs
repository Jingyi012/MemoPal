namespace MemoPal.Application.Features.XpEvents.DTOs;

public sealed record XpEventDto(
    string Id,
    string SourceType,
    string? SourceId,
    int XpAmount,
    string ClientEventId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? CreatedBy,
    string? UpdatedBy,
    bool IsDeleted,
    DateTime? DeletedAt,
    string? DeletedBy
);
