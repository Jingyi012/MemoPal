using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Missions;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text;

namespace MemoPal.Api.Security;

/// <summary>
/// Seeds only the minimum data required to operate a fresh MemoPal environment.
/// Product content is managed through the API and admin application instead of
/// being coupled to files or legacy learning models at startup.
/// </summary>
public sealed class AdminBootstrapper
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly AdminBootstrapOptions _options;

    public AdminBootstrapper(
        IAppDbContext db,
        IPasswordHasher passwordHasher,
        IOptions<AdminBootstrapOptions> options)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _options = options.Value;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await EnsureMissionTemplatesAsync(cancellationToken);
        if (_options.SeedStarterContent)
        {
            await EnsureStarterPalaceSceneAsync(cancellationToken);
        }

        if (_options.Enabled &&
            !string.IsNullOrWhiteSpace(_options.Email) &&
            !string.IsNullOrWhiteSpace(_options.Password))
        {
            await EnsureAdminUserAsync(cancellationToken);
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureStarterPalaceSceneAsync(CancellationToken cancellationToken)
    {
        const string starterName = "The Memory Room";
        if (await _db.PalaceScenes.AnyAsync(
                x => x.IsTemplate && x.Name == starterName && !x.IsDeleted,
                cancellationToken))
        {
            return;
        }

        var now = DateTime.UtcNow;
        var sceneId = "starter-memory-room";
        var scene = new PalaceScene
        {
            Id = sceneId,
            Name = starterName,
            Description = "A bright, familiar room with ten easy-to-spot loci.",
            ImageUrl = BuildStarterSceneImageUrl(),
            Status = PalaceSceneStatuses.Published,
            IsTemplate = true,
            IsPremium = false,
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = "system",
            UpdatedBy = "system"
        };

        var loci = new[]
        {
            ("Entry bench", 14m, 78m),
            ("Wall mirror", 31m, 62m),
            ("Coffee table", 49m, 43m),
            ("Window plant", 68m, 28m),
            ("Reading chair", 86m, 52m),
            ("Bookshelf", 78m, 78m),
            ("Desk lamp", 58m, 61m),
            ("Rug corner", 38m, 34m),
            ("Door handle", 20m, 18m),
            ("Ceiling light", 50m, 14m)
        };

        for (var index = 0; index < loci.Length; index++)
        {
            var (name, xPercent, yPercent) = loci[index];
            scene.Loci.Add(new PalaceLocus
            {
                Id = $"{sceneId}-locus-{index + 1}",
                PalaceSceneId = sceneId,
                Position = index + 1,
                Name = name,
                Description = $"A clear visual stop at the {name.ToLowerInvariant()}.",
                XPercent = xPercent,
                YPercent = yPercent,
                RadiusPercent = 7m,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            });
        }

        _db.PalaceScenes.Add(scene);
    }

    private static string BuildStarterSceneImageUrl()
    {
        const string svg = """
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560">
              <defs>
                <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="plum"/><stop offset="1" stop-color="mediumpurple"/></linearGradient>
                <linearGradient id="floor" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="goldenrod"/><stop offset="1" stop-color="gold"/></linearGradient>
              </defs>
              <rect width="900" height="560" fill="url(#sky)"/><rect y="340" width="900" height="220" fill="url(#floor)" opacity=".35"/>
              <path d="M70 360h760M110 120v250M790 120v250M110 120h680" fill="none" stroke="ivory" stroke-width="12" opacity=".8"/>
              <rect x="170" y="250" width="150" height="90" rx="18" fill="hotpink" opacity=".82"/><circle cx="550" cy="210" r="70" fill="mediumseagreen" opacity=".82"/><rect x="650" y="290" width="110" height="60" rx="14" fill="deepskyblue" opacity=".85"/>
              <text x="450" y="78" fill="darkslateblue" font-family="Arial" font-size="32" font-weight="700" text-anchor="middle">The Memory Room</text>
            </svg>
            """;

        return $"data:image/svg+xml;base64,{Convert.ToBase64String(Encoding.UTF8.GetBytes(svg))}";
    }

    private async Task EnsureAdminUserAsync(CancellationToken cancellationToken)
    {
        var email = _options.Email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid().ToString("N"),
                Email = email,
                DisplayName = string.IsNullOrWhiteSpace(_options.DisplayName) ? "Admin" : _options.DisplayName.Trim(),
                PasswordHash = _passwordHasher.Hash(_options.Password),
                Role = UserRoles.Admin,
                IsPremium = true,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            };
            _db.Users.Add(user);
            return;
        }

        user.Role = UserRoles.Admin;
        user.IsPremium = true;
        user.UpdatedAt = now;
        user.UpdatedBy = "system";
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            user.PasswordHash = _passwordHasher.Hash(_options.Password);
        }
    }

    private async Task EnsureMissionTemplatesAsync(CancellationToken cancellationToken)
    {
        if (await _db.MissionTemplates.AnyAsync(x => !x.IsDeleted, cancellationToken))
        {
            return;
        }

        var now = DateTime.UtcNow;
        foreach (var template in MissionTemplateSerializer.GetDefaultTemplates())
        {
            _db.MissionTemplates.Add(new MissionTemplate
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = template.Key,
                Title = template.Title,
                Description = template.Description,
                MetricType = template.MetricType,
                Period = template.Period,
                TargetValue = template.TargetValue,
                RewardXp = template.RewardXp,
                SortOrder = template.SortOrder,
                IsActive = template.IsActive,
                Version = 1,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            });
        }
    }
}
