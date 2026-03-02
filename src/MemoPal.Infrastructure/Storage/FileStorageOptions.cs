namespace MemoPal.Infrastructure.Storage;

public sealed class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string RootPath { get; set; } = "storage";
    public string PublicBasePath { get; set; } = "/files";
}
