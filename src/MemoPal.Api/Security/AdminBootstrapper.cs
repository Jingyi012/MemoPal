using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MemoPal.Api.Security;

public sealed class AdminBootstrapper
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly AdminBootstrapOptions _options;

    public AdminBootstrapper(IAppDbContext db, IPasswordHasher passwordHasher, IOptions<AdminBootstrapOptions> options)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _options = options.Value;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled) return;
        if (string.IsNullOrWhiteSpace(_options.Email) || string.IsNullOrWhiteSpace(_options.Password)) return;

        var email = _options.Email.Trim().ToLowerInvariant();
        var existing = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (existing is null)
        {
            _db.Users.Add(new User
            {
                Id = Guid.NewGuid().ToString("N"),
                Email = email,
                DisplayName = string.IsNullOrWhiteSpace(_options.DisplayName) ? "Admin" : _options.DisplayName,
                PasswordHash = _passwordHasher.Hash(_options.Password),
                Role = UserRoles.Admin,
                IsPremium = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            existing.Role = UserRoles.Admin;
            existing.IsPremium = true;
            existing.UpdatedAt = DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(existing.PasswordHash))
            {
                existing.PasswordHash = _passwordHasher.Hash(_options.Password);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}
