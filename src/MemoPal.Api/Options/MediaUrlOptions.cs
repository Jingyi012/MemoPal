namespace MemoPal.Api.Options;

public sealed class MediaUrlOptions
{
    public const string SectionName = "MediaUrl";

    public string? BaseUrl { get; set; }
    public bool DiagnosticsEnabled { get; set; }
}
