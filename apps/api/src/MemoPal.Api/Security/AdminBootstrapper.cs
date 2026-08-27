using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Missions;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

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
        var existing = await _db.PalaceScenes
            .Include(x => x.Loci)
            .FirstOrDefaultAsync(x => x.IsTemplate && x.Name == starterName && !x.IsDeleted, cancellationToken);
        if (existing is not null)
        {
            // Replace only the old generated SVG starter. Admin-authored edits
            // remain authoritative after the first real-image upgrade.
            if (existing.ImageUrl.StartsWith("data:image/svg+xml", StringComparison.OrdinalIgnoreCase))
            {
                var upgradeAt = DateTime.UtcNow;
                existing.Description = "A warm study room with twelve clear furniture and décor landmarks.";
                existing.ImageUrl = "/assets/palace-scenes/11-study-room.png";
                existing.Version += 1;
                existing.UpdatedAt = upgradeAt;
                existing.UpdatedBy = "system";

                var starterLoci = GetStarterLoci();
                var existingLoci = existing.Loci.OrderBy(x => x.Position).ToList();
                for (var index = 0; index < starterLoci.Length; index++)
                {
                    var (name, xPercent, yPercent) = starterLoci[index];
                    var locus = index < existingLoci.Count ? existingLoci[index] : new PalaceLocus
                    {
                        Id = $"{existing.Id}-locus-{index + 1}",
                        PalaceSceneId = existing.Id,
                        CreatedAt = upgradeAt,
                        CreatedBy = "system"
                    };
                    locus.Position = index + 1;
                    locus.Name = name;
                    locus.Description = $"A clear visual stop at the {name.ToLowerInvariant()}.";
                    locus.XPercent = xPercent;
                    locus.YPercent = yPercent;
                    locus.RadiusPercent = 7m;
                    locus.IsDeleted = false;
                    locus.UpdatedAt = upgradeAt;
                    locus.UpdatedBy = "system";
                    if (index >= existingLoci.Count) existing.Loci.Add(locus);
                }

                foreach (var locus in existingLoci.Skip(starterLoci.Length))
                {
                    locus.IsDeleted = true;
                    locus.UpdatedAt = upgradeAt;
                    locus.UpdatedBy = "system";
                }
            }
            return;
        }

        var now = DateTime.UtcNow;
        var sceneId = "starter-memory-room";
        var scene = new PalaceScene
        {
            Id = sceneId,
            Name = starterName,
            Description = "A warm study room with twelve clear furniture and décor landmarks.",
            ImageUrl = "/assets/palace-scenes/11-study-room.png",
            Status = PalaceSceneStatuses.Published,
            IsTemplate = true,
            IsPremium = false,
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = "system",
            UpdatedBy = "system"
        };

        var loci = GetStarterLoci();

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

    private static (string Name, decimal XPercent, decimal YPercent)[] GetStarterLoci() =>
    [
        ("Framed landscape", 11m, 24m),
        ("Desk lamp", 8m, 50m),
        ("Desk surface", 27m, 57m),
        ("Bookcase", 34m, 33m),
        ("Desk chair", 31m, 71m),
        ("Rug corner", 41m, 84m),
        ("Window", 53m, 30m),
        ("Reading chair", 63m, 60m),
        ("Side table", 74m, 54m),
        ("Wall clock", 80m, 25m),
        ("Tall plant", 84m, 49m),
        ("Side cabinet", 94m, 66m)
    ];

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
