namespace MemoPal.Application.Features.Avatars.DTOs;

public sealed record AvatarDefinitionDto(
    string Id,
    string Key,
    string AssetKey,
    string? ImageUrl,
    string? CompanionCharacterImageUrl,
    string TitleEn,
    string TitleZh,
    string DescriptionEn,
    string DescriptionZh,
    int RequiredLevel,
    int SortOrder,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class AvatarDefinitionUpsertRequest
{
    public string? Id { get; set; }
    public string? Key { get; set; }
    public string? AssetKey { get; set; }
    public string? ImageUrl { get; set; }
    public string? CompanionCharacterImageUrl { get; set; }
    public string? TitleEn { get; set; }
    public string? TitleZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionZh { get; set; }
    public int RequiredLevel { get; set; } = 1;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
