namespace MemoPal.Application.Features.Words.DTOs;

public sealed record WordDto(
    string Id,
    string LessonId,
    string LocationId,
    string Text,
    string? Meaning,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastSyncedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class WordUpsertRequest
{
    public string? Id { get; set; }
    public string? LessonId { get; set; }
    public string? LocationId { get; set; }
    public string? Text { get; set; }
    public string? Meaning { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public sealed class BatchDeleteWordsRequest
{
    public IReadOnlyList<string> Ids { get; set; } = [];
}

