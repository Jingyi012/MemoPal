namespace MemoPal.Application.Common.Interfaces;

public interface IPrivateAttachmentStorage
{
    Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken = default);
    Task<PrivateAttachmentContent?> OpenReadAsync(string key, CancellationToken cancellationToken = default);
    Task DeleteAsync(string key, CancellationToken cancellationToken = default);
    Task<int> DeleteOrphanedFilesAsync(IReadOnlySet<string> referencedKeys, DateTime olderThanUtc, CancellationToken cancellationToken = default);
}

public sealed record PrivateAttachmentContent(Stream Content, string ContentType);
