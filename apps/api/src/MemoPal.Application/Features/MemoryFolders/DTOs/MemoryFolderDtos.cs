namespace MemoPal.Application.Features.MemoryFolders.DTOs;

public sealed record MemoryFolderDto(
    string Id,
    string Name,
    string Emoji,
    string Description,
    int MemorySetCount,
    int ItemCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed class MemoryFolderRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Emoji { get; set; }
    public string? Description { get; set; }
}

public sealed class MoveMemorySetToFolderRequest
{
    public string? FolderId { get; set; }
}
