namespace MemoPal.Application.Features.Appearance.DTOs;

public sealed record AppearanceDefinitionDto(
    string Id,
    string Key,
    string ItemType,
    string? CompanionAvatarKey,
    string? SetKey,
    string? SetTitleEn,
    string? SetTitleZh,
    string? SetStoryEn,
    string? SetStoryZh,
    string AssetKey,
    string? ImageUrl,
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

public sealed class AppearanceDefinitionUpsertRequest
{
    public string? Id { get; set; }
    public string? Key { get; set; }
    public string? ItemType { get; set; }
    public string? CompanionAvatarKey { get; set; }
    public string? SetKey { get; set; }
    public string? SetTitleEn { get; set; }
    public string? SetTitleZh { get; set; }
    public string? SetStoryEn { get; set; }
    public string? SetStoryZh { get; set; }
    public string? AssetKey { get; set; }
    public string? ImageUrl { get; set; }
    public string? TitleEn { get; set; }
    public string? TitleZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionZh { get; set; }
    public int RequiredLevel { get; set; } = 1;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
