namespace MemoPal.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveImageAsync(
        Stream content,
        string extension,
        string folder,
        string filePrefix,
        CancellationToken cancellationToken = default);
}
