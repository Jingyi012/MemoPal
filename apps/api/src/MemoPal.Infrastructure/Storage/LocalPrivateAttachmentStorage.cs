using System.Text.RegularExpressions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace MemoPal.Infrastructure.Storage;

public sealed class LocalPrivateAttachmentStorage : IPrivateAttachmentStorage
{
    private static readonly IReadOnlyDictionary<string, string> ContentTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
        [".m4a"] = "audio/mp4",
        [".mp3"] = "audio/mpeg",
        [".wav"] = "audio/wav",
        [".webm"] = "audio/webm"
    };
    private static readonly Regex KeyPattern = new("^[a-f0-9]{32}\\.(jpg|jpeg|png|webp|m4a|mp3|wav|webm)$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private readonly string _rootPath;

    public LocalPrivateAttachmentStorage(IOptions<FileStorageOptions> options)
    {
        var publicRoot = Path.GetFullPath(options.Value.RootPath);
        _rootPath = Path.GetFullPath(options.Value.PrivateRootPath);
        if (IsWithin(_rootPath, publicRoot) || IsWithin(publicRoot, _rootPath))
            throw new InvalidOperationException("Private attachment storage must be separate from the public media directory.");
    }

    public async Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken = default)
    {
        var normalizedExtension = extension.StartsWith('.') ? extension.ToLowerInvariant() : $".{extension.ToLowerInvariant()}";
        if (!ContentTypes.ContainsKey(normalizedExtension))
            throw new ArgumentException("The private attachment format is not supported.", nameof(extension));

        Directory.CreateDirectory(_rootPath);
        var key = $"{Guid.NewGuid():N}{normalizedExtension}";
        var path = Path.Combine(_rootPath, key);
        await using var destination = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await content.CopyToAsync(destination, cancellationToken);
        return key;
    }

    public Task<PrivateAttachmentContent?> OpenReadAsync(string key, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!TryGetPath(key, out var path) || !File.Exists(path)) return Task.FromResult<PrivateAttachmentContent?>(null);
        Stream content = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);
        return Task.FromResult<PrivateAttachmentContent?>(new(content, ContentTypes[Path.GetExtension(path)]));
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (TryGetPath(key, out var path)) File.Delete(path);
        return Task.CompletedTask;
    }

    public Task<int> DeleteOrphanedFilesAsync(IReadOnlySet<string> referencedKeys, DateTime olderThanUtc, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(referencedKeys);
        cancellationToken.ThrowIfCancellationRequested();
        if (!Directory.Exists(_rootPath)) return Task.FromResult(0);

        var deleted = 0;
        foreach (var path in Directory.EnumerateFiles(_rootPath, "*", SearchOption.TopDirectoryOnly))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var key = Path.GetFileName(path);
            if (!KeyPattern.IsMatch(key) || referencedKeys.Contains(key) || File.GetLastWriteTimeUtc(path) > olderThanUtc)
                continue;
            File.Delete(path);
            deleted++;
        }
        return Task.FromResult(deleted);
    }

    private bool TryGetPath(string key, out string path)
    {
        path = string.Empty;
        if (!KeyPattern.IsMatch(key)) return false;
        path = Path.Combine(_rootPath, key);
        return true;
    }

    private static bool IsWithin(string candidate, string root)
    {
        var relative = Path.GetRelativePath(root, candidate);
        return relative == "." || (relative != ".." && !relative.StartsWith($"..{Path.DirectorySeparatorChar}", StringComparison.Ordinal) &&
            !relative.StartsWith($"..{Path.AltDirectorySeparatorChar}", StringComparison.Ordinal));
    }
}
