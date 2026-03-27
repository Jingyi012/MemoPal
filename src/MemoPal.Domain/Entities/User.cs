using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class User : AuditableBaseEntity
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = UserRoles.User;
    public string? AvatarUrl { get; set; }
    public int TotalXp { get; set; }
    public int Level { get; set; } = 1;
    public bool IsPremium { get; set; }
    public string? ReferredByUserId { get; set; }

    public UserStats? Stats { get; set; }
    public ICollection<UserAuthIdentity> AuthIdentities { get; set; } = [];
}
