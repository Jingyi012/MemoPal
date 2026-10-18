using System.Text;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using MemoPal.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace MemoPal.UnitTests;

public sealed class EducationAttachmentOrphanCleanupWorkerTests
{
    [Fact]
    public async Task KeepsFilesWithActiveOrSoftDeletedMetadataAndRemovesOnlyUnreferencedOrphans()
    {
        var root = Path.Combine(Path.GetTempPath(), $"memopal-orphan-worker-{Guid.NewGuid():N}");
        var publicRoot = Path.Combine(root, "public");
        var privateRoot = Path.Combine(root, "private");
        var dbName = $"education-orphan-worker-{Guid.NewGuid():N}";
        var now = DateTime.UtcNow;
        Directory.CreateDirectory(privateRoot);
        var storage = new LocalPrivateAttachmentStorage(Options.Create(new FileStorageOptions
        {
            RootPath = publicRoot,
            PrivateRootPath = privateRoot
        }));
        var bytes = Encoding.UTF8.GetBytes("attachment");

        try
        {
            await using var activeUpload = new MemoryStream(bytes);
            var activeKey = await storage.SaveAsync(activeUpload, ".png");
            await using var deletedUpload = new MemoryStream(bytes);
            var deletedKey = await storage.SaveAsync(deletedUpload, ".jpg");
            await using var orphanUpload = new MemoryStream(bytes);
            var orphanKey = await storage.SaveAsync(orphanUpload, ".webp");
            foreach (var key in new[] { activeKey, deletedKey, orphanKey })
                File.SetLastWriteTimeUtc(Path.Combine(privateRoot, key), now.AddDays(-2));

            var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(dbName).Options;
            await using (var seed = new AppDbContext(options))
            {
                seed.EducationAssessmentAttachments.AddRange(
                    new EducationAssessmentAttachment { Id = "active", StorageKey = activeKey },
                    new EducationAssessmentAttachment { Id = "soft-deleted", StorageKey = deletedKey, IsDeleted = true });
                await seed.SaveChangesAsync();
            }

            var services = new ServiceCollection();
            services.AddLogging();
            services.AddDbContext<AppDbContext>(builder => builder.UseInMemoryDatabase(dbName));
            services.AddSingleton<IPrivateAttachmentStorage>(storage);
            using var provider = services.BuildServiceProvider();
            using var worker = ActivatorUtilities.CreateInstance<EducationAttachmentOrphanCleanupWorker>(provider);

            var deletedCount = await worker.CleanupOnceAsync(now);

            Assert.Equal(1, deletedCount);
            Assert.True(File.Exists(Path.Combine(privateRoot, activeKey)));
            Assert.True(File.Exists(Path.Combine(privateRoot, deletedKey)));
            Assert.False(File.Exists(Path.Combine(privateRoot, orphanKey)));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }
}
