namespace MemoPal.Application.Common.Interfaces;

public interface ICurrentUserAccessor
{
    string? UserId { get; }
}
