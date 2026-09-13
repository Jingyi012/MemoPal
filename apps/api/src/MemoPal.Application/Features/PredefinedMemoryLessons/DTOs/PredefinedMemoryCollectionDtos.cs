namespace MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;

public sealed record PredefinedMemoryCollectionDto(
    string Id, string TitleEn, string TitleZh, string DescriptionEn, string DescriptionZh,
    string Emoji, string CategoryId, bool IsPublished, int SortOrder, int Version,
    IReadOnlyList<PredefinedMemoryLessonDto> Lessons);

public sealed class PredefinedMemoryCollectionRequest
{
    public string TitleEn { get; set; } = string.Empty;
    public string TitleZh { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string DescriptionZh { get; set; } = string.Empty;
    public string Emoji { get; set; } = "📚";
    public string CategoryId { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }
    public int? ExpectedVersion { get; set; }
    public IReadOnlyList<string> LessonIds { get; set; } = [];
}

public sealed record DownloadMemoryCollectionRequest(string Language = "zh");
public sealed record DownloadMemoryCollectionDto(string FolderId, int MemorySetCount, bool AlreadyDownloaded);
