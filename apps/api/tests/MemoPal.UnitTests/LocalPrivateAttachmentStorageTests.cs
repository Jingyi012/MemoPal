using System.Text;
using MemoPal.Infrastructure.Storage;
using Microsoft.Extensions.Options;

namespace MemoPal.UnitTests;

public sealed class LocalPrivateAttachmentStorageTests
{
    [Fact]
    public void RejectsPrivateStorageInsideOrAroundPublicStaticRoot()
    {
        var root = Path.Combine(Path.GetTempPath(), $"memopal-root-{Guid.NewGuid():N}");
        Assert.Throws<InvalidOperationException>(() => new LocalPrivateAttachmentStorage(Options.Create(new FileStorageOptions
        {
            RootPath = Path.Combine(root, "public"),
            PrivateRootPath = Path.Combine(root, "public", "private")
        })));
        Assert.Throws<InvalidOperationException>(() => new LocalPrivateAttachmentStorage(Options.Create(new FileStorageOptions
        {
            RootPath = root,
            PrivateRootPath = root
        })));
    }

    [Fact]
    public async Task SavesSupportedAttachmentsOutsidePublicRootAndRejectsPathTraversalKeys()
    {
        var publicRoot = Path.Combine(Path.GetTempPath(), $"memopal-public-{Guid.NewGuid():N}");
        var privateRoot = Path.Combine(Path.GetTempPath(), $"memopal-private-{Guid.NewGuid():N}");
        Directory.CreateDirectory(publicRoot);
        var storage = new LocalPrivateAttachmentStorage(Options.Create(new FileStorageOptions
        {
            RootPath = publicRoot,
            PrivateRootPath = privateRoot
        }));

        try
        {
            var bytes = Encoding.UTF8.GetBytes("test attachment bytes");
            await using var upload = new MemoryStream(bytes);
            var key = await storage.SaveAsync(upload, ".png");

            Assert.Matches("^[a-f0-9]{32}\\.png$", key);
            Assert.False(File.Exists(Path.Combine(publicRoot, key)));
            var stored = await storage.OpenReadAsync(key);
            Assert.NotNull(stored);
            Assert.Equal("image/png", stored.ContentType);
            await using (stored.Content)
            await using (var content = new MemoryStream())
            {
                await stored.Content.CopyToAsync(content);
                Assert.Equal(bytes, content.ToArray());
            }

            Assert.Null(await storage.OpenReadAsync("../secret.png"));
            await storage.DeleteAsync(key);
            Assert.Null(await storage.OpenReadAsync(key));
            await Assert.ThrowsAsync<ArgumentException>(() => storage.SaveAsync(new MemoryStream(bytes), ".svg"));
        }
        finally
        {
            if (Directory.Exists(publicRoot)) Directory.Delete(publicRoot, recursive: true);
            if (Directory.Exists(privateRoot)) Directory.Delete(privateRoot, recursive: true);
        }
    }

    [Fact]
    public async Task DeletesOnlyOldUnreferencedFilesWithValidStorageKeys()
    {
        var root = Path.Combine(Path.GetTempPath(), $"memopal-private-{Guid.NewGuid():N}");
        var storage = new LocalPrivateAttachmentStorage(Options.Create(new FileStorageOptions
        {
            RootPath = Path.Combine(root, "public"),
            PrivateRootPath = Path.Combine(root, "private")
        }));
        Directory.CreateDirectory(Path.Combine(root, "private"));
        var bytes = Encoding.UTF8.GetBytes("test attachment bytes");
        try
        {
            await using var retainedUpload = new MemoryStream(bytes);
            var retainedKey = await storage.SaveAsync(retainedUpload, ".png");
            await using var orphanUpload = new MemoryStream(bytes);
            var orphanKey = await storage.SaveAsync(orphanUpload, ".jpg");
            await using var recentUpload = new MemoryStream(bytes);
            var recentKey = await storage.SaveAsync(recentUpload, ".webp");
            File.SetLastWriteTimeUtc(Path.Combine(root, "private", retainedKey), DateTime.UtcNow.AddDays(-2));
            File.SetLastWriteTimeUtc(Path.Combine(root, "private", orphanKey), DateTime.UtcNow.AddDays(-2));
            File.WriteAllText(Path.Combine(root, "private", "unrecognized.tmp"), "keep");

            var deleted = await storage.DeleteOrphanedFilesAsync(
                new HashSet<string>([retainedKey], StringComparer.OrdinalIgnoreCase), DateTime.UtcNow.AddHours(-24));

            Assert.Equal(1, deleted);
            var retained = await storage.OpenReadAsync(retainedKey);
            Assert.NotNull(retained);
            await retained.Content.DisposeAsync();
            Assert.Null(await storage.OpenReadAsync(orphanKey));
            var recent = await storage.OpenReadAsync(recentKey);
            Assert.NotNull(recent);
            await recent.Content.DisposeAsync();
            Assert.True(File.Exists(Path.Combine(root, "private", "unrecognized.tmp")));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }
}
