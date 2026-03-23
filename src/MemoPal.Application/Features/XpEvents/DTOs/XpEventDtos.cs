namespace MemoPal.Application.Features.XpEvents.DTOs;

public sealed record XpEventDto(
    string Id,
    string SourceType,
    string? SourceId,
    int XpAmount,
    string ClientEventId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed class XpEventUpsertRequest
{
    public string? Id { get; set; }
    public string? SourceType { get; set; }
    public string? SourceId { get; set; }
    public int XpAmount { get; set; }
    public string? ClientEventId { get; set; }
}
