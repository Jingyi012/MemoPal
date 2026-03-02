using MemoPal.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace MemoPal.Infrastructure.Storage;

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageOptions _options;

    public LocalFileStorageService(IOptions<FileStorageOptions> options)
    {
        _options = options.Value;
    }

    public async Task<string> SaveImageAsync(
        Stream content,
        string extension,
        string folder,
        string filePrefix,
        CancellationToken cancellationToken = default)
    {
        var safeExt = extension.StartsWith('.') ? extension.ToLowerInvariant() : $".{extension.ToLowerInvariant()}";
        var safeFolder = folder.Trim('/').Replace("..", string.Empty);
        var safePrefix = filePrefix.Replace("..", string.Empty);

        var root = Path.GetFullPath(_options.RootPath);
        var targetFolder = Path.Combine(root, safeFolder);
        Directory.CreateDirectory(targetFolder);

        var fileName = $"{safePrefix}_{Guid.NewGuid():N}{safeExt}";
        var targetPath = Path.Combine(targetFolder, fileName);

        await using (var fs = File.Create(targetPath))
        {
            await content.CopyToAsync(fs, cancellationToken);
        }

        var publicBase = _options.PublicBasePath.TrimEnd('/');
        return $"{publicBase}/{safeFolder}/{fileName}";
    }
}
