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
        var compactPrefix = BuildCompactPrefix(safePrefix);

        var root = Path.GetFullPath(_options.RootPath);
        var targetFolder = Path.Combine(root, safeFolder);
        Directory.CreateDirectory(targetFolder);

        var fileName = $"{compactPrefix}_{Guid.NewGuid():N[..16]}{safeExt}";
        var targetPath = Path.Combine(targetFolder, fileName);

        await using (var fs = File.Create(targetPath))
        {
            await content.CopyToAsync(fs, cancellationToken);
        }

        var publicBase = _options.PublicBasePath.TrimEnd('/');
        return $"{publicBase}/{safeFolder}/{fileName}";
    }

    private static string BuildCompactPrefix(string rawPrefix)
    {
        var alphanumericChars = rawPrefix.Where(char.IsLetterOrDigit).ToArray();
        if (alphanumericChars.Length == 0)
        {
            return "img";
        }

        var compactPrefix = new string(alphanumericChars).ToLowerInvariant();
        const int maxPrefixLength = 10;

        return compactPrefix.Length > maxPrefixLength
            ? compactPrefix[..maxPrefixLength]
            : compactPrefix;
    }
}
